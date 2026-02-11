import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    severity?: 'warning' | 'error' | 'info';
    confirmColor?: 'error' | 'primary' | 'warning';
    loading?: boolean;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    severity = 'warning',
    confirmColor = 'primary',
    loading = false
}: ConfirmDialogProps) {
    const getIcon = () => {
        switch (severity) {
            case 'error':
                return <ErrorOutlineIcon sx={{ fontSize: 48, color: '#f44336' }} />;
            case 'warning':
                return <WarningAmberIcon sx={{ fontSize: 48, color: '#ff9800' }} />;
            case 'info':
                return <HelpOutlineIcon sx={{ fontSize: 48, color: '#2196f3' }} />;
            default:
                return <WarningAmberIcon sx={{ fontSize: 48, color: '#ff9800' }} />;
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                    {getIcon()}
                    <Typography variant="h6" fontWeight={600}>
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" color="text.secondary">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onCancel} variant="outlined" disabled={loading}>
                    {cancelText}
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    color={confirmColor}
                    autoFocus
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {loading ? 'Processing...' : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
