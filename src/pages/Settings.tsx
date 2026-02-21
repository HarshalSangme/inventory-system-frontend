import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import {
  Box, Typography, Paper, Button, Dialog, DialogContent, DialogActions,
  TextField, Avatar, Stack, Chip, Divider, useTheme, Grid, Card, CardContent,
  Tooltip, Fade, alpha, LinearProgress, Skeleton, IconButton, InputAdornment,
  Tabs, Tab,
} from '@mui/material';
import { getAllUsers, addUser, updateUser, sendVerificationEmail, verifyEmail } from '../services/userService';
import { useSnackbar } from '../context/SnackbarContext';
// Icons
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ShieldIcon from '@mui/icons-material/Shield';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Role config
const ROLE_CONFIG: Record<string, { label: string; color: string; gradient: string; icon: React.ReactElement }> = {
  admin: { label: 'Admin', color: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', icon: <AdminPanelSettingsIcon /> },
  manager: { label: 'Manager', color: '#0891b2', gradient: 'linear-gradient(135deg, #0891b2 0%, #67e8f9 100%)', icon: <SupervisorAccountIcon /> },
  sales: { label: 'Sales', color: '#059669', gradient: 'linear-gradient(135deg, #059669 0%, #6ee7b7 100%)', icon: <StorefrontIcon /> },
  viewonly: { label: 'View Only', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280 0%, #d1d5db 100%)', icon: <VisibilityIcon /> },
};

const Settings: React.FC = () => {
  const { role } = useUser();
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();

  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add user
  const [addOpen, setAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'sales' });
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Edit user
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [showEditPwd, setShowEditPwd] = useState(false);

  // Fetch users
  useEffect(() => {
    setLoading(true);
    getAllUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  // Stats
  const totalUsers = users.length;
  const verifiedCount = users.filter(u => u.email_verified && u.email).length;
  const pendingCount = users.filter(u => u.email && !u.email_verified).length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  // Handlers
  const handleSendVerification = async (userId: number) => {
    try {
      await sendVerificationEmail(userId);
      showSnackbar('Verification email sent!', 'success');
      const updated = await getAllUsers();
      setUsers(updated);
    } catch {
      showSnackbar('Failed to send verification email.', 'error');
    }
  };

  const handleVerifyEmail = async (token: string) => {
    try {
      await verifyEmail(token);
      showSnackbar('Email verified successfully!', 'success');
      const updated = await getAllUsers();
      setUsers(updated);
    } catch {
      showSnackbar('Failed to verify email.', 'error');
    }
  };

  const handleEditOpen = (user: any) => {
    if (role === 'viewonly') return;
    setEditUser({ ...user, password: '' });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (role === 'viewonly' || !editUser) return;
    setLoading(true);
    try {
      await updateUser(editUser.id, {
        username: editUser.username,
        email: editUser.email || undefined,
        password: editUser.password || undefined,
        role: editUser.role,
      });
      const updated = await getAllUsers();
      setUsers(updated);
      setEditOpen(false);
      setEditUser(null);
      showSnackbar('User updated successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error?.response?.data?.detail || 'Failed to update user.', 'error');
    }
    setLoading(false);
  };

  const handleAddUser = async () => {
    if (role === 'viewonly') return;
    setLoading(true);
    try {
      await addUser(newUser);
      const updated = await getAllUsers();
      setUsers(updated);
      setAddOpen(false);
      setNewUser({ username: '', password: '', role: 'sales' });
      showSnackbar('User created successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error?.response?.data?.detail || 'Failed to add user.', 'error');
    }
    setLoading(false);
  };

  // Stat card component
  const StatCard = ({ icon, label, value, gradient, iconBg }: { icon: React.ReactNode; label: string; value: number; gradient: string; iconBg: string }) => (
    <Card
      elevation={0}
      sx={{
        background: gradient,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
              {label}
            </Typography>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 800, mt: 0.5, lineHeight: 1 }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: iconBg, width: 52, height: 52, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
      {/* Decorative circle */}
      <Box sx={{
        position: 'absolute', bottom: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)',
      }} />
    </Card>
  );

  // User card component
  const UserCard = ({ user }: { user: any }) => {
    const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewonly;
    const hasEmail = !!user.email;
    const isVerified = hasEmail && user.email_verified;
    const isPending = hasEmail && !user.email_verified;

    return (
      <Fade in timeout={400}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.08),
            background: '#fff',
            transition: 'all 0.3s ease',
            cursor: role === 'viewonly' ? 'default' : 'pointer',
            '&:hover': role !== 'viewonly' ? {
              borderColor: alpha(roleConf.color, 0.3),
              boxShadow: `0 8px 30px ${alpha(roleConf.color, 0.1)}`,
              transform: 'translateY(-2px)',
            } : {},
          }}
          onClick={() => handleEditOpen(user)}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    width: 48, height: 48,
                    background: roleConf.gradient,
                    fontSize: 20, fontWeight: 700,
                    boxShadow: `0 4px 12px ${alpha(roleConf.color, 0.3)}`,
                  }}
                >
                  {user.username?.[0]?.toUpperCase() || '?'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                    {user.username}
                  </Typography>
                  <Chip
                    size="small"
                    icon={roleConf.icon}
                    label={roleConf.label}
                    sx={{
                      mt: 0.5,
                      bgcolor: alpha(roleConf.color, 0.1),
                      color: roleConf.color,
                      fontWeight: 600,
                      fontSize: 11,
                      height: 24,
                      '& .MuiChip-icon': { color: roleConf.color, fontSize: 14 },
                    }}
                  />
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title={user.is_active ? 'Active' : 'Inactive'}>
                  <Chip
                    size="small"
                    label={user.is_active ? 'Active' : 'Inactive'}
                    sx={{
                      bgcolor: user.is_active ? alpha('#059669', 0.1) : alpha('#ef4444', 0.1),
                      color: user.is_active ? '#059669' : '#ef4444',
                      fontWeight: 600, fontSize: 11, height: 24,
                    }}
                  />
                </Tooltip>
                {role !== 'viewonly' && (
                  <Tooltip title="Edit user">
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                      }}
                      onClick={(e) => { e.stopPropagation(); handleEditOpen(user); }}
                    >
                      <EditIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>

            <Divider sx={{ mb: 1.5, borderColor: alpha(theme.palette.divider, 0.06) }} />

            {/* Email section */}
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <EmailIcon sx={{ fontSize: 16, color: alpha('#000', 0.35) }} />
              <Typography variant="body2" sx={{ color: hasEmail ? alpha('#000', 0.7) : alpha('#000', 0.3), fontWeight: 500, fontSize: 13 }}>
                {user.email || 'No email set'}
              </Typography>
            </Stack>

            {/* Verification status */}
            <Box sx={{ mt: 1 }}>
              {!hasEmail ? (
                <Chip
                  size="small"
                  icon={<GppMaybeIcon />}
                  label="No email configured"
                  sx={{
                    bgcolor: alpha('#9ca3af', 0.1), color: '#6b7280',
                    fontWeight: 500, fontSize: 11, height: 26,
                    '& .MuiChip-icon': { color: '#9ca3af', fontSize: 15 },
                  }}
                />
              ) : isVerified ? (
                <Chip
                  size="small"
                  icon={<VerifiedUserIcon />}
                  label="Email Verified"
                  sx={{
                    bgcolor: alpha('#059669', 0.1), color: '#059669',
                    fontWeight: 600, fontSize: 11, height: 26,
                    '& .MuiChip-icon': { color: '#059669', fontSize: 15 },
                  }}
                />
              ) : (
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    icon={<GppMaybeIcon />}
                    label="Pending Verification"
                    sx={{
                      bgcolor: alpha('#f59e0b', 0.1), color: '#d97706',
                      fontWeight: 600, fontSize: 11, height: 26,
                      '& .MuiChip-icon': { color: '#f59e0b', fontSize: 15 },
                    }}
                  />
                  {user.email_verification_token && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                      onClick={(e) => { e.stopPropagation(); handleVerifyEmail(user.email_verification_token); }}
                      sx={{
                        textTransform: 'none', fontWeight: 600, fontSize: 11,
                        borderRadius: 2, px: 1.5, py: 0.3, height: 26,
                        background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
                        boxShadow: 'none',
                        '&:hover': { boxShadow: `0 4px 12px ${alpha('#059669', 0.4)}` },
                      }}
                    >
                      Verify Now
                    </Button>
                  )}
                  {role === 'admin' && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SendIcon sx={{ fontSize: 13 }} />}
                      onClick={(e) => { e.stopPropagation(); handleSendVerification(user.id); }}
                      sx={{
                        textTransform: 'none', fontWeight: 600, fontSize: 11,
                        borderRadius: 2, px: 1.5, py: 0.3, height: 26,
                        borderColor: alpha('#7c3aed', 0.3), color: '#7c3aed',
                        '&:hover': { borderColor: '#7c3aed', bgcolor: alpha('#7c3aed', 0.05) },
                      }}
                    >
                      Send Email
                    </Button>
                  )}
                </Stack>
              )}
            </Box>

            {/* View only enforced warning */}
            {isPending && (
              <Box sx={{
                mt: 1.5, p: 1, borderRadius: 1.5,
                bgcolor: alpha('#ef4444', 0.05), border: `1px solid ${alpha('#ef4444', 0.1)}`,
              }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <ShieldIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                  <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, fontSize: 11 }}>
                    Role restricted to View Only until email is verified
                  </Typography>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 1.5, sm: 2.5, md: 3 } }}>
      {/* Page header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
          }}>
            <SettingsIcon sx={{ fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#1e293b', lineHeight: 1.2 }}>
              Settings
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              Manage users, roles & email verification
            </Typography>
          </Box>
        </Stack>
        {role !== 'viewonly' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddOpen(true)}
            sx={{
              textTransform: 'none', fontWeight: 700, fontSize: 14,
              borderRadius: 2.5, px: 3, py: 1.2,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Add User
          </Button>
        )}
      </Stack>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTabs-indicator': {
              height: 3, borderRadius: 3,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            },
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 600, fontSize: 14,
              color: '#94a3b8', minHeight: 44,
              '&.Mui-selected': { color: '#6366f1' },
            },
          }}
        >
          <Tab icon={<PeopleAltIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Users & Employees" />
          <Tab icon={<SecurityIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Security & Email" />
          <Tab icon={<SettingsIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Other Settings" />
        </Tabs>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* TAB 0: Users */}
      {tab === 0 && (
        <Fade in>
          <Box>
            {/* Stat cards */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6} sm={3}>
                <StatCard
                  icon={<GroupIcon sx={{ fontSize: 26, color: '#fff' }} />}
                  label="Total Users"
                  value={totalUsers}
                  gradient="linear-gradient(135deg, #6366f1 0%, #818cf8 100%)"
                  iconBg="rgba(255,255,255,0.2)"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  icon={<VerifiedUserIcon sx={{ fontSize: 26, color: '#fff' }} />}
                  label="Verified"
                  value={verifiedCount}
                  gradient="linear-gradient(135deg, #059669 0%, #34d399 100%)"
                  iconBg="rgba(255,255,255,0.2)"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  icon={<GppMaybeIcon sx={{ fontSize: 26, color: '#fff' }} />}
                  label="Pending"
                  value={pendingCount}
                  gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                  iconBg="rgba(255,255,255,0.2)"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  icon={<AdminPanelSettingsIcon sx={{ fontSize: 26, color: '#fff' }} />}
                  label="Admins"
                  value={adminCount}
                  gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)"
                  iconBg="rgba(255,255,255,0.2)"
                />
              </Grid>
            </Grid>

            {/* User cards grid */}
            {loading ? (
              <Grid container spacing={2}>
                {[1, 2, 3].map(i => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
            ) : users.length === 0 ? (
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#fff' }}>
                <PeopleAltIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
                <Typography variant="h6" fontWeight={600} color="text.secondary">No users found</Typography>
                <Typography variant="body2" color="text.disabled" mt={0.5}>Create your first user to get started</Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {users.map(user => (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <UserCard user={user} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Fade>
      )}

      {/* TAB 1: Security & Email */}
      {tab === 1 && (
        <Fade in>
          <Box>
            <Grid container spacing={2.5}>
              {/* Email verification overview */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.08), height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                      <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), width: 40, height: 40 }}>
                        <MarkEmailReadIcon sx={{ color: '#6366f1', fontSize: 22 }} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>
                        Email Verification
                      </Typography>
                    </Stack>

                    <Stack spacing={2}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#059669', 0.05), border: `1px solid ${alpha('#059669', 0.1)}` }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#059669' }}>Verified Users</Typography>
                          </Stack>
                          <Typography variant="h5" fontWeight={800} sx={{ color: '#059669' }}>{verifiedCount}</Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.05), border: `1px solid ${alpha('#f59e0b', 0.1)}` }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <GppMaybeIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#d97706' }}>Pending Verification</Typography>
                          </Stack>
                          <Typography variant="h5" fontWeight={800} sx={{ color: '#d97706' }}>{pendingCount}</Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#6b7280', 0.05), border: `1px solid ${alpha('#6b7280', 0.1)}` }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <EmailIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#6b7280' }}>No Email Set</Typography>
                          </Stack>
                          <Typography variant="h5" fontWeight={800} sx={{ color: '#6b7280' }}>{users.filter(u => !u.email).length}</Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Security policies */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.08), height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                      <Avatar sx={{ bgcolor: alpha('#7c3aed', 0.1), width: 40, height: 40 }}>
                        <SecurityIcon sx={{ color: '#7c3aed', fontSize: 22 }} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>
                        Security Policies
                      </Typography>
                    </Stack>

                    <Stack spacing={2}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <ShieldIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b' }}>Email Verification Required</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Users must verify email before accessing privileged roles</Typography>
                          </Box>
                          <Chip label="Enabled" size="small" sx={{ ml: 'auto', bgcolor: alpha('#059669', 0.1), color: '#059669', fontWeight: 600, fontSize: 11 }} />
                        </Stack>
                      </Box>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <ShieldIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b' }}>Token Expiry</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Verification tokens expire after 24 hours</Typography>
                          </Box>
                          <Chip label="24h" size="small" sx={{ ml: 'auto', bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', fontWeight: 600, fontSize: 11 }} />
                        </Stack>
                      </Box>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <ShieldIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b' }}>Password Policy</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Min 8 chars, uppercase, lowercase & digit required</Typography>
                          </Box>
                          <Chip label="Enabled" size="small" sx={{ ml: 'auto', bgcolor: alpha('#059669', 0.1), color: '#059669', fontWeight: 600, fontSize: 11 }} />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Users requiring attention */}
              <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.08) }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                      <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), width: 40, height: 40 }}>
                        <GppMaybeIcon sx={{ color: '#f59e0b', fontSize: 22 }} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>
                        Users Requiring Attention
                      </Typography>
                    </Stack>

                    {users.filter(u => (u.email && !u.email_verified) || !u.email).length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: '#059669', mb: 1 }} />
                        <Typography variant="body1" fontWeight={600} color="#059669">All users are verified!</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1.5}>
                        {users.filter(u => (u.email && !u.email_verified) || !u.email).map(user => (
                          <Box key={user.id} sx={{ p: 2, borderRadius: 2, bgcolor: '#fefce8', border: '1px solid', borderColor: alpha('#f59e0b', 0.15) }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#f59e0b', 0.2), color: '#d97706', fontWeight: 700, fontSize: 14 }}>
                                  {user.username?.[0]?.toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>{user.username}</Typography>
                                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                    {user.email ? `${user.email} — pending verification` : 'No email configured'}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Stack direction="row" spacing={1}>
                                {user.email && !user.email_verified && user.email_verification_token && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                                    onClick={() => handleVerifyEmail(user.email_verification_token)}
                                    sx={{
                                      textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 2,
                                      background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: 'none',
                                    }}
                                  >
                                    Verify
                                  </Button>
                                )}
                                {user.email && !user.email_verified && role === 'admin' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<SendIcon sx={{ fontSize: 13 }} />}
                                    onClick={() => handleSendVerification(user.id)}
                                    sx={{
                                      textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 2,
                                      borderColor: alpha('#7c3aed', 0.3), color: '#7c3aed',
                                    }}
                                  >
                                    Send Email
                                  </Button>
                                )}
                                {!user.email && role !== 'viewonly' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<EditIcon sx={{ fontSize: 13 }} />}
                                    onClick={() => handleEditOpen(user)}
                                    sx={{
                                      textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 2,
                                      borderColor: alpha('#6366f1', 0.3), color: '#6366f1',
                                    }}
                                  >
                                    Add Email
                                  </Button>
                                )}
                              </Stack>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {/* TAB 2: Other Settings */}
      {tab === 2 && (
        <Fade in>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.08) }}>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <SettingsIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} color="text.secondary">More settings coming soon</Typography>
              <Typography variant="body2" color="text.disabled" mt={0.5}>Additional configuration options will be available here</Typography>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* ===== EDIT USER DIALOG ===== */}
      <Dialog
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditUser(null); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
          },
        }}
      >
        {/* Dialog gradient header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          p: 3, pb: 2.5,
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
              <EditIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>Edit User</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Update user details and permissions</Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Username"
              name="username"
              value={editUser?.username || ''}
              onChange={(e) => setEditUser({ ...editUser, [e.target.name]: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><BadgeIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Email"
              name="email"
              value={editUser?.email || ''}
              onChange={(e) => setEditUser({ ...editUser, [e.target.name]: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><EmailIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Password (leave blank to keep)"
              name="password"
              type={showEditPwd ? 'text' : 'password'}
              value={editUser?.password || ''}
              onChange={(e) => setEditUser({ ...editUser, [e.target.name]: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><ShieldIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowEditPwd(p => !p)} edge="end" size="small">
                      {showEditPwd ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Role"
              name="role"
              value={editUser?.role || ''}
              onChange={(e) => setEditUser({ ...editUser, [e.target.name]: e.target.value })}
              fullWidth
              select
              SelectProps={{ native: true }}
              variant="outlined"
              disabled={editUser?.email && !editUser?.email_verified}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><PersonIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <option value="admin">Admin</option>
              <option value="sales">Sales</option>
              <option value="manager">Manager</option>
              <option value="viewonly">View Only</option>
            </TextField>
            {editUser?.email && !editUser?.email_verified && (
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.08), border: `1px solid ${alpha('#f59e0b', 0.2)}` }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GppMaybeIcon sx={{ color: '#d97706', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>
                    Role changes are locked until email is verified
                  </Typography>
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
          <Button
            onClick={() => { setEditOpen(false); setEditUser(null); }}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3, borderColor: '#e2e8f0', color: '#64748b', '&:hover': { borderColor: '#cbd5e1' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={role === 'viewonly'}
            sx={{
              borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.45)' },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== ADD USER DIALOG ===== */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
          p: 3, pb: 2.5,
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
              <AddIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>Add New User</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Create a new user or employee account</Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Username"
              name="username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, [e.target.name]: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><BadgeIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Password"
              name="password"
              type={showNewPwd ? 'text' : 'password'}
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, [e.target.name]: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><ShieldIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPwd(p => !p)} edge="end" size="small">
                      {showNewPwd ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Role"
              name="role"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, [e.target.name]: e.target.value })}
              fullWidth
              select
              SelectProps={{ native: true }}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><PersonIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <option value="admin">Admin</option>
              <option value="sales">Sales</option>
              <option value="manager">Manager</option>
              <option value="viewonly">View Only</option>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
          <Button
            onClick={() => setAddOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3, borderColor: '#e2e8f0', color: '#64748b', '&:hover': { borderColor: '#cbd5e1' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddUser}
            variant="contained"
            disabled={role === 'viewonly'}
            sx={{
              borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3,
              background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
              boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(5,150,105,0.45)' },
            }}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
