import React, { useEffect, useState, useRef } from "react";
import type { Product, ProductForm } from "../services/productService";
import type { Category } from "../services/categoryService";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  importProducts,
} from "../services/productService";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryService";
import { uploadProductImage, deleteProductImage } from "../services/imageUploadService";
import ImageCropper from "../components/ImageCropper";
import ConfirmDialog from "../components/ConfirmDialog";
import LinearProgress from "@mui/material/LinearProgress";
import Avatar from "@mui/material/Avatar";
import ImageIcon from "@mui/icons-material/Image";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

// Extend the Window interface to allow __refreshProducts
declare global {
  interface Window {
    __refreshProducts?: () => void;
  }
}
import { useUser } from "../context/UserContext";
import { useSnackbar } from "../context/SnackbarContext";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
// Keep Chip, MenuItem, etc.
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { DataGrid } from '@mui/x-data-grid';

export default function Products() {
  const { role } = useUser();
  const { showSnackbar } = useSnackbar();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Loading States
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Removed local snackbar state, using global snackbar

  // Import Dialog State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Column Filter State
  const [filterName, setFilterName] = useState("");
  const [filterSku, setFilterSku] = useState("");

  // Category State
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryMargin, setNewCategoryMargin] = useState<number>(40);
  const [categoryError, setCategoryError] = useState("");
  // Margin edit state for existing categories
  const [categoryMargins, setCategoryMargins] = useState<{ [id: number]: number }>({});
  const [savingMargin, setSavingMargin] = useState<{ [id: number]: boolean }>({});
  // Sync categoryMargins with categories
  useEffect(() => {
    const initial: { [id: number]: number } = {};
    categories.forEach(cat => {
      initial[cat.id] = cat.margin_percent ?? 40;
    });
    setCategoryMargins(initial);
  }, [categories]);

  // Image Upload State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State

  const [formData, setFormData] = useState<ProductForm & { _manualPrice?: boolean }>({
    name: "",
    sku: "",
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock_level: 5,
    description: "",
    category_id: null,
    image_url: null,
    _manualPrice: false,
  });

  // Ensure modal always shows latest product data after refresh
  useEffect(() => {
    if (isModalOpen && editingId !== null) {
      const latestProduct = products.find((p) => p.id === editingId);
      if (latestProduct) {
        setFormData({
          name: latestProduct.name,
          sku: latestProduct.sku,
          price: latestProduct.price,
          cost_price: latestProduct.cost_price,
          stock_quantity: latestProduct.stock_quantity,
          min_stock_level: latestProduct.min_stock_level,
          description: latestProduct.description || "",
          category_id: latestProduct.category_id || null,
          image_url: latestProduct.image_url || null,
          _manualPrice: false,
        });
        setImagePreview(latestProduct.image_url || null);
      }
    }
  }, [products, editingId, isModalOpen]);

  useEffect(() => {
    window.__refreshProducts = loadProducts;
    loadCategories();
    return () => {
      delete window.__refreshProducts;
    };
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, rowsPerPage, debouncedSearch, categoryFilter, filterName, filterSku]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getProducts(page * rowsPerPage, rowsPerPage, debouncedSearch || undefined, filterName || undefined, filterSku || undefined, categoryFilter || undefined);
      setProducts(res.data);
      setTotalProducts(res.total);
    } catch (error: any) {
      console.error("Failed to load products", error);
      const msg = error?.response?.data?.detail || "Failed to load products";
      showSnackbar(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Failed to load categories";
      showSnackbar(msg, "error");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "viewonly") {
      showSnackbar("View Only users cannot add or edit products.", "error");
      return;
    }
    setSaving(true);
    try {
      // Validation: Selling price must respect category margin
      const cat = categories.find(c => c.id === formData.category_id);
      const marginPercent = cat?.margin_percent ?? 0; // Default to 0 if no category selected
      const minPrice = formData.cost_price * (1 + marginPercent / 100);

      if (formData.price < minPrice) {
        showSnackbar(`Selling price must be at least ${marginPercent}% greater than cost price (min: ${minPrice.toFixed(2)}).`, "error");
        setSaving(false);
        return;
      }
      // Check for SKU uniqueness right before creation
      let uniqueSKU = formData.sku;
      const allSKUs = new Set(products.map((p) => p.sku.toLowerCase()));
      if (!editingId) {
        // If the SKU already exists, find a new one
        if (allSKUs.has(uniqueSKU.toLowerCase())) {
          let nextNumber = 1;
          while (allSKUs.has(`sku-${String(nextNumber).padStart(3, "0")}`)) {
            nextNumber++;
          }
          uniqueSKU = `SKU-${String(nextNumber).padStart(3, "0")}`;
        }
      }
      const productToSave = { ...formData, sku: uniqueSKU };
      // The edit validation has been merged into the main validation above
      if (editingId) {
        await updateProduct(editingId, productToSave);
        showSnackbar("Product updated successfully", "success");
      } else {
        await createProduct(productToSave);
        showSnackbar("Product created successfully", "success");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setImagePreview(null);
      await loadProducts();
      setFormData({
        name: "",
        sku: "",
        price: 0,
        cost_price: 0,
        stock_quantity: 0,
        min_stock_level: 5,
        description: "",
        category_id: null,
        image_url: null,
      });
    } catch (error: any) {
      console.error("Failed to create/update product", error);
      const msg =
        error?.response?.data?.detail || "Failed to create/update product";
      showSnackbar(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (role === "viewonly") {
      showSnackbar("View Only users cannot delete products.", "error");
      return;
    }
    setDeleting(true);
    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
      showSnackbar("Product deleted successfully", "success");
    } catch (error: any) {
      console.error("Failed to delete product", error);
      const msg = error?.response?.data?.detail || "Failed to delete product";
      showSnackbar(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  const openAddModal = async () => {
    if (role === "viewonly") return;
    setEditingId(null);
    setLoading(true);
    try {
      // Fetch latest products to get SKUs
      const latestProducts = await getProducts();
      const usedNumbers = new Set(
        latestProducts.data
          .map((p: Product) => {
            const match = p.sku.match(/SKU-(\d+)/i);
            return match ? parseInt(match[1]) : null;
          })
          .filter((n: number | null): n is number => n !== null && !isNaN(n)),
      );
      let nextNumber = 1;
      while (usedNumbers.has(nextNumber)) {
        nextNumber++;
      }
      const nextSKU = `SKU-${String(nextNumber).padStart(3, "0")}`;
      setFormData({
        name: "",
        sku: nextSKU,
        price: 0,
        cost_price: 0,
        stock_quantity: 0,
        min_stock_level: 5,
        description: "",
        image_url: null,
      });
      setImagePreview(null);
      setIsModalOpen(true);
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail || "Failed to fetch SKUs for new product";
      showSnackbar(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Selection Functions
  const handleBulkDeleteClick = () => {
    if (role === "viewonly") return;
    if (selectedIds.length === 0) return;
    setBulkDeleteConfirm(true);
  };

  const handleBulkDelete = async () => {
    if (role === "viewonly") {
      showSnackbar("View Only users cannot delete products.", "error");
      return;
    }
    setBulkDeleteConfirm(false);
    try {
      setBulkDeleteLoading(true);
      await bulkDeleteProducts(selectedIds);
      setProducts(products.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      showSnackbar(
        `Successfully deleted ${selectedIds.length} product(s)`,
        "success",
      );
    } catch (error: any) {
      console.error("Failed to bulk delete products", error);
      const msg = error?.response?.data?.detail || "Failed to delete products";
      showSnackbar(msg, "error");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Import Dialog Functions
  const handleImportClick = () => {
    if (role === "viewonly") return;
    setImportDialogOpen(true);
    setSelectedFile(null);
    setUploadStatus("idle");
    setUploadMessage("");
    setUploadProgress(0);
  };

  const handleFileSelect = (file: File) => {
    if (file && file.name.endsWith(".xlsx")) {
      setSelectedFile(file);
      setUploadStatus("idle");
      setUploadMessage("");
    } else {
      setUploadMessage("Please select a valid Excel file (.xlsx)");
      setUploadStatus("error");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleImportUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("idle");

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await importProducts(selectedFile);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("success");
      setUploadMessage(result.message || "Products imported successfully!");

      // Show snackbar and reload
      showSnackbar("Products imported successfully!", "success");

      // Reload products after 1.5 seconds
      setTimeout(async () => {
        await loadProducts();
        setTimeout(() => {
          setImportDialogOpen(false);
          setSelectedFile(null);
          setUploadStatus("idle");
          setUploadMessage("");
        }, 1000);
      }, 1500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setUploadStatus("error");
      const errorMessage =
        err.response?.data?.detail ||
        "Failed to import products. Please check the file format.";
      setUploadMessage(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setUploadMessage("");
    setUploadProgress(0);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, categoryFilter, filterName, filterSku]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 400, color: "#1a1a1a" }}>
            Products
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your inventory items
          </Typography>
        </Box>
        <Box>
          {selectedIds.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={
                bulkDeleteLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <DeleteSweepIcon />
                )
              }
              onClick={handleBulkDeleteClick}
              disabled={bulkDeleteLoading || role === "viewonly"}
              sx={{ mr: 2 }}
            >
              Delete {selectedIds.length} Selected
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={handleImportClick}
            sx={{ mr: 2 }}
            disabled={role === "viewonly"}
          >
            Import Data
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddModal}
            size="large"
            disabled={role === "viewonly"}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Search & Filter */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={8}>
          <TextField
            label="Search Products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            placeholder="Search by name or SKU..."
            sx={{ minHeight: 40 }}
            InputProps={{ sx: { height: 40 } }}
          />
        </Grid>
        <Grid item xs={4}>
          <Autocomplete
            options={categories}
            getOptionLabel={(option: Category) => option.name}
            value={categories.find((cat) => cat.id === categoryFilter) || null}
            onChange={(_event: any, newValue: Category | null) =>
              setCategoryFilter(newValue ? newValue.id : "")
            }
            renderInput={(params: any) => (
              <TextField
                {...params}
                label="Filter by Category"
                size="small"
                fullWidth
                placeholder="Search category..."
                sx={{ minHeight: 40 }}
                InputProps={{ ...params.InputProps, sx: { height: 40 } }}
              />
            )}
            isOptionEqualToValue={(option: Category, value: Category) =>
              option.id === value.id
            }
            clearOnEscape
            sx={{ minHeight: 40 }}
          />
        </Grid>
      </Grid>

      {/* Products Table */}
      <Card elevation={2}>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ width: '100%', mb: 2 }}>
                <DataGrid
                  rows={products}
                  columns={[
                    { field: 'id', headerName: 'ID', width: 70 },
                    { field: 'image_url', headerName: 'Image', width: 70, sortable: false, filterable: false, renderCell: (params: any) => (
                        <Avatar src={params.value || undefined} variant="rounded" sx={{ width: 40, height: 40, bgcolor: '#f0f0f0' }}>
                          <ImageIcon sx={{ color: '#ccc', fontSize: 20 }} />
                        </Avatar>
                    )},
                    { field: 'name', headerName: 'Product Name', flex: 1, minWidth: 200 },
                    { field: 'sku', headerName: 'SKU', width: 150 },
                    { field: 'category_id', headerName: 'Category', width: 150, valueGetter: (params: any) => {
                        if (!params || !params.row) return "Uncategorized";
                        const cat = categories.find((c: any) => c.id === params.row.category_id);
                        return cat ? cat.name : "Uncategorized";
                    }},
                    { field: 'cost_price', headerName: 'Cost Price', width: 110, type: 'number' },
                    { field: 'price', headerName: 'Retail Price', width: 110, type: 'number' },
                    { field: 'stock_quantity', headerName: 'Stock', width: 100, type: 'number' },
                    { field: 'status', headerName: 'Status', width: 120, filterable: false, renderCell: (params: any) => {
                        if (!params || !params.row) return null;
                        const low = params.row.stock_quantity < params.row.min_stock_level;
                        return <Chip label={low ? "Low Stock" : "In Stock"} color={low ? "error" : "success"} size="small" variant="outlined" />;
                    }},
                    { field: 'actions', headerName: 'Actions', width: 120, sortable: false, filterable: false, renderCell: (params: any) => {
                        if (!params || !params.row) return null;
                        return (
                          <>
                            <IconButton size="small" onClick={(e) => { 
                              e.stopPropagation(); 
                              if (role === "viewonly") return;
                              setEditingId(params.row.id);
                              setFormData({
                                name: params.row.name,
                                sku: params.row.sku,
                                price: params.row.price,
                                cost_price: params.row.cost_price,
                                stock_quantity: params.row.stock_quantity,
                                min_stock_level: params.row.min_stock_level,
                                description: params.row.description || "",
                                category_id: params.row.category_id || null,
                                image_url: params.row.image_url || null,
                                _manualPrice: false
                              });
                              setImagePreview(params.row.image_url || null);
                              setIsModalOpen(true);
                            }} disabled={role === "viewonly"}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(params.row.id); }} disabled={role === "viewonly"}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        );
                    }}
                  ]}
                  rowCount={totalProducts}
                  loading={loading}
                  pageSizeOptions={[10, 25, 50, 100]}
                  paginationModel={{ page, pageSize: rowsPerPage }}
                  paginationMode="server"
                  onPaginationModelChange={(model: any) => {
                    setPage(model.page);
                    setRowsPerPage(model.pageSize);
                  }}
                  checkboxSelection
                  onRowSelectionModelChange={(newSelectionModel) => {
                      setSelectedIds(newSelectionModel as any as number[]);
                  }}
                  filterMode="server"
                  onFilterModelChange={(model: any) => {
                      // Reset all filters first
                      setFilterName("");
                      setFilterSku("");
                      
                      // Apply all current filters
                      model.items.forEach((item: any) => {
                          if (item.field === 'name') setFilterName(item.value || "");
                          if (item.field === 'sku') setFilterSku(item.value || "");
                      });
                  }}
                  onRowClick={() => {}} // Disable default row click if needed
                  // @ts-ignore
                  rowSelectionModel={selectedIds}
                  disableRowSelectionOnClick
                  autoHeight
                  sx={{ border: 'none' }}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Product Dialog */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 400, py: 2 }}>
          {editingId ? "Edit Product" : "Add New Product"}
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="product-form"
            onSubmit={handleCreate}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 2 }}
          >
            {/* Product Image Upload */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                p: 2,
                border: '2px dashed #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fafafa',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#1976d2', backgroundColor: '#f5f9ff' },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      showSnackbar('Image must be less than 5MB', 'error');
                      return;
                    }
                    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                      showSnackbar('Only JPEG, PNG, and WebP images are allowed', 'error');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setCropImageSrc(reader.result as string);
                      setCropperOpen(true);
                    };
                    reader.readAsDataURL(file);
                  }
                  // Reset input so same file can be re-selected
                  e.target.value = '';
                }}
              />
              {imagePreview ? (
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Product"
                    sx={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      bgcolor: '#1976d2',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PhotoCameraIcon sx={{ color: '#fff', fontSize: 16 }} />
                  </Box>
                </Box>
              ) : (
                <>
                  <PhotoCameraIcon sx={{ fontSize: 40, color: '#bdbdbd' }} />
                  <Typography variant="body2" color="text.secondary">
                    Click to upload product image
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    JPEG, PNG, or WebP • Max 5MB
                  </Typography>
                </>
              )}
              {imageUploading && <CircularProgress size={24} sx={{ mt: 1 }} />}
            </Box>

            {/* Image Cropper Dialog */}
            <ImageCropper
              open={cropperOpen}
              imageSrc={cropImageSrc}
              onClose={() => setCropperOpen(false)}
              onCropComplete={async (croppedBlob) => {
                setCropperOpen(false);
                setImageUploading(true);
                try {
                  // Delete old image if replacing
                  if (formData.image_url) {
                    await deleteProductImage(formData.image_url);
                  }
                  const url = await uploadProductImage(croppedBlob, 'product.jpg');
                  setFormData((prev) => ({ ...prev, image_url: url }));
                  setImagePreview(url);
                  showSnackbar('Image uploaded successfully', 'success');
                } catch (err: any) {
                  console.error('Image upload failed:', err);
                  showSnackbar('Failed to upload image', 'error');
                } finally {
                  setImageUploading(false);
                }
              }}
            />

            <TextField
              required
              fullWidth
              label="Product Name"
              placeholder="e.g., Laptop"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
              sx={{ minWidth: 240 }}
            />
            <TextField
              required
              fullWidth
              label="SKU / Barcode"
              placeholder="e.g., SKU001"
              value={formData.sku}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, sku: e.target.value })
              }
            />
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={10}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Category (Vehicle Type)"
                  value={formData.category_id ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      category_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  disabled={categoryLoading}
                  helperText={categoryLoading ? "Loading categories..." : ""}
                >
                  <MenuItem value="">Uncategorized</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={2}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setCategoryDialogOpen(true)}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  Manage
                </Button>
              </Grid>
            </Grid>
            {/* Category Management Dialog */}
            <Dialog
              open={categoryDialogOpen}
              onClose={() => setCategoryDialogOpen(false)}
              maxWidth="xs"
              fullWidth
            >
              <DialogTitle>Manage Categories</DialogTitle>
              <DialogContent>
                <Grid container spacing={1} sx={{ mb: 3 }}>
                  <Grid item xs={7}>
                    <TextField
                      label="New Category Name"
                      value={newCategoryName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewCategoryName(e.target.value)
                      }
                      fullWidth
                      size="small"
                      error={!!categoryError}
                      helperText={categoryError}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Margin %"
                      type="number"
                      size="small"
                      fullWidth
                      value={newCategoryMargin}
                      onChange={e => setNewCategoryMargin(Number(e.target.value))}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={async () => {
                        if (!newCategoryName.trim()) {
                          setCategoryError("Name required");
                          return;
                        }
                        setCategoryError("");
                        try {
                          await createCategory({ name: newCategoryName, margin_percent: newCategoryMargin });
                          setNewCategoryName("");
                          setNewCategoryMargin(40);
                          await loadCategories();
                        } catch {
                          setCategoryError("Failed to add");
                        }
                      }}
                      sx={{ height: '40px' }}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 1 }}>
                  {/* Header Row */}
                  {categories.length > 0 && (
                    <Grid container spacing={1} sx={{ mb: 1.5, px: 1, borderBottom: '1px solid #eee', pb: 0.5 }}>
                      <Grid item xs={7}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                          Category Name
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                          Margin %
                        </Typography>
                      </Grid>
                      <Grid item xs={2} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                          Action
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                  {categories.map((cat) => (
                    <Grid
                      container
                      key={cat.id}
                      spacing={1}
                      alignItems="center"
                      sx={{
                        mb: 1.5,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        '&:hover': { backgroundColor: '#f9f9f9' }
                      }}
                    >
                      <Grid item xs={7}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cat.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={categoryMargins[cat.id] ?? 40}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setCategoryMargins(prev => ({ ...prev, [cat.id]: val }));
                          }}
                          onBlur={async () => {
                            const margin = categoryMargins[cat.id] ?? 40;
                            if (margin !== (cat.margin_percent ?? 40)) {
                              setSavingMargin(prev => ({ ...prev, [cat.id]: true }));
                              try {
                                await updateCategory(cat.id, { name: cat.name, margin_percent: margin });
                                await loadCategories();
                                showSnackbar('Margin updated', 'success');
                              } catch {
                                showSnackbar('Failed to update margin', 'error');
                              } finally {
                                setSavingMargin(prev => ({ ...prev, [cat.id]: false }));
                              }
                            }
                          }}
                          inputProps={{ min: 0, max: 100, step: 0.1, style: { padding: '8.5px 14px' } }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#fff'
                            }
                          }}
                          disabled={!!savingMargin[cat.id]}
                        />
                      </Grid>
                      <Grid item xs={2} sx={{ textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={async () => {
                            await deleteCategory(cat.id);
                            await loadCategories();
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                  {categories.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      No categories found. Add one above.
                    </Typography>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setCategoryDialogOpen(false)}>
                  Close
                </Button>
              </DialogActions>
            </Dialog>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  label="Selling Price"
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  value={formData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, price: Number(e.target.value), _manualPrice: true });
                  }}
                  helperText={(() => {
                    if (formData.cost_price > 0 && formData.category_id) {
                      const cat = categories.find(c => c.id === formData.category_id);
                      const margin = cat?.margin_percent ?? 40;
                      const rec = formData.cost_price * (1 + margin / 100);
                      return `Recommended Selling Price: ${rec.toFixed(2)} (Margin: ${margin}%)`;
                    }
                    return '';
                  })()}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  label="Cost Price"
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  value={formData.cost_price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newCost = Number(e.target.value);
                    setFormData(prev => {
                      // If user hasn't manually overridden price, always update price instantly
                      if (!prev._manualPrice) {
                        return { ...prev, cost_price: newCost, price: +(1.4 * newCost).toFixed(2) };
                      }
                      // If user has overridden, only update cost price
                      return { ...prev, cost_price: newCost };
                    });
                  }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  label="Current Stock"
                  type="number"
                  inputProps={{ min: "0" }}
                  value={formData.stock_quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      stock_quantity: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  label="Min Stock Level"
                  type="number"
                  inputProps={{ min: "0" }}
                  value={formData.min_stock_level}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      min_stock_level: Number(e.target.value),
                    })
                  }
                />
              </Grid>
            </Grid>
            <TextField
              required
              fullWidth
              label="Description"
              multiline
              rows={3}
              placeholder="Add product details..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setIsModalOpen(false);
              setEditingId(null);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="product-form"
            variant="contained"
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {saving ? "Saving..." : editingId ? "Update" : "Save"} Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Product?"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
        confirmText="Delete"
        confirmColor="error"
        severity="error"
        loading={deleting}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title="Delete Multiple Products?"
        message={`Are you sure you want to delete ${selectedIds.length} product(s)? This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
        confirmText="Delete All"
        confirmColor="error"
        severity="warning"
        loading={bulkDeleteLoading}
      />

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => !uploading && setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={1}>
              <CloudUploadIcon />
              <Typography variant="h6">Import Products</Typography>
            </Box>
            <IconButton
              onClick={() => !uploading && setImportDialogOpen(false)}
              disabled={uploading}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Instructions */}
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: "#e3f2fd",
              border: "1px solid #90caf9",
            }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ mb: 1, color: "#1976d2" }}
            >
              📋 Excel File Requirements:
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              ✓ <strong>File format:</strong> .xlsx (Excel file)
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              ✓ <strong>Header row:</strong> Must be on row 3 of your Excel
              sheet
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ <strong>Required columns</strong> (exact names):
            </Typography>
            <Box sx={{ pl: 2, mb: 1 }}>
              <Typography
                variant="caption"
                component="div"
                sx={{ fontFamily: "monospace", mb: 0.3 }}
              >
                • DESCRIPTION (product name)
              </Typography>
              <Typography
                variant="caption"
                component="div"
                sx={{ fontFamily: "monospace", mb: 0.3 }}
              >
                • RATE (cost price)
              </Typography>
              <Typography
                variant="caption"
                component="div"
                sx={{ fontFamily: "monospace", mb: 0.3 }}
              >
                • Retail Price without VAT (selling price)
              </Typography>
              <Typography
                variant="caption"
                component="div"
                sx={{ fontFamily: "monospace", mb: 0.3 }}
              >
                • Order Qty (stock quantity)
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              💡 Tip: Column names must match exactly (case-sensitive)
            </Typography>
          </Paper>

          {!selectedFile ? (
            /* Drag & Drop Area */
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                border: "2px dashed",
                borderColor: dragActive ? "primary.main" : "grey.300",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                backgroundColor: dragActive
                  ? "action.hover"
                  : "background.paper",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "action.hover",
                },
              }}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <CloudUploadIcon
                sx={{ fontSize: 64, color: "primary.main", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Drag & Drop your Excel file here
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                or
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>
                Browse Files
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                style={{ display: "none" }}
                onChange={(e) =>
                  e.target.files?.[0] && handleFileSelect(e.target.files[0])
                }
              />
            </Box>
          ) : (
            /* Selected File Display */
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: "#f5f5f5",
                  border: "1px solid",
                  borderColor: "grey.300",
                  borderRadius: 2,
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box display="flex" alignItems="center" gap={2} flex={1}>
                    <DescriptionIcon
                      sx={{ fontSize: 40, color: "primary.main" }}
                    />
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                  </Box>
                  {!uploading && (
                    <IconButton
                      onClick={handleRemoveFile}
                      size="small"
                      color="error"
                    >
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
              </Paper>

              {/* Progress Bar */}
              {uploading && (
                <Box sx={{ mt: 3 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Uploading...
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {uploadProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: "grey.200",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#1a1a1a",
                        borderRadius: 1,
                      },
                    }}
                  />
                </Box>
              )}

              {/* Status Messages */}
              {uploadStatus === "success" && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: "#e8f5e9",
                    border: "1px solid #4caf50",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CheckCircleIcon sx={{ color: "#4caf50" }} />
                  <Typography variant="body2">{uploadMessage}</Typography>
                </Paper>
              )}
              {uploadStatus === "error" && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: "#ffebee",
                    border: "1px solid #f44336",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <ErrorIcon sx={{ color: "#f44336" }} />
                  <Typography variant="body2">{uploadMessage}</Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setImportDialogOpen(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleImportUpload}
            disabled={!selectedFile || uploading || uploadStatus === "success"}
            startIcon={uploading ? null : <CloudUploadIcon />}
          >
            {uploading ? "Importing..." : "Import Products"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global snackbar is now used via SnackbarProvider; local snackbar JSX removed */}
    </Box>
  );
}
