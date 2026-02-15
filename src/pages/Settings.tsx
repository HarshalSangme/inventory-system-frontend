import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, Stack, Chip, Divider, useTheme
} from '@mui/material';
import { getAllUsers, addUser } from '../services/userService';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BadgeIcon from '@mui/icons-material/Badge';


const Settings: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'sales' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use backend user info for access control
    import('../services/userService').then(({ getCurrentUser }) => {
      getCurrentUser()
        .then(user => {
          setIsAdmin(user.role === 'admin');
        })
        .catch(() => setIsAdmin(false))
        .finally(() => setChecked(true));
    });
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      getAllUsers()
        .then(data => setUsers(data))
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  if (!checked) return null;
  if (!isAdmin) {
    return (
      <Box p={4}>
        <Typography variant="h4" color="error" gutterBottom>
          <AdminPanelSettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Access Denied
        </Typography>
        <Typography variant="body1">You do not have permission to view this page.</Typography>
      </Box>
    );
  }

  const handleTabChange = (_: any, newValue: number) => setTab(newValue);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, [e.target.name]: e.target.value });
  // Placeholder for add user logic (should call backend)
  const handleAddUser = async () => {
    setLoading(true);
    try {
      await addUser(newUser);
      // Refresh user list after adding
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
      setNewUser({ username: '', password: '', role: 'sales' });
    } catch (err) {
      // Optionally show error
      alert('Failed to add user.');
    }
    setOpen(false);
    setLoading(false);
  };

  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #f8fafc 0%, #e0e7ef 100%)',
        py: { xs: 1, sm: 2, md: 3 },
        px: { xs: 0.5, sm: 1.5, md: 2 },
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: '100%',
          mx: 0,
          p: { xs: 1.5, sm: 2, md: 2.5 },
          borderRadius: 0,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(3px)',
          boxShadow: '0 2px 12px 0 rgba(31,38,135,0.08)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <SettingsIcon color="primary" fontSize="medium" />
          <Typography variant="h4" fontWeight={700} letterSpacing={0.5} sx={{ color: theme.palette.primary.dark }}>
            Settings
          </Typography>
        </Stack>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 1, borderRadius: 0.5, background: 'transparent', minHeight: 0 }}
        >
          <Tab icon={<GroupIcon />} iconPosition="start" label={<b>USERS & EMPLOYEES</b>} sx={{ fontWeight: 600, fontSize: 15, minHeight: 0, py: 0.5 }} />
          <Tab icon={<SettingsIcon />} iconPosition="start" label={<b>OTHER SETTINGS</b>} sx={{ fontWeight: 600, fontSize: 15, minHeight: 0, py: 0.5 }} />
        </Tabs>
        <Divider sx={{ mb: 1 }} />
        {tab === 0 && (
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{ mb: 2, borderRadius: 2, fontWeight: 600, px: 2, py: 1, fontSize: 14, boxShadow: 1, background: 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)' }}
            >
              ADD USER/EMPLOYEE
            </Button>
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, background: 'rgba(255,255,255,0.98)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: 'rgba(240,245,255,0.5)' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 14 }}><BadgeIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Username</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 14 }}><EmailIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 14 }}><PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Role</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 14 }}>Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                  ) : users.length === 0 ? (
                    <TableRow><TableCell colSpan={4}>No users found.</TableCell></TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{ transition: 'background 0.2s', '&:hover': { background: 'rgba(99,102,241,0.06)' } }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.2}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 16, bgcolor: user.role === 'admin' ? 'primary.main' : 'grey.400', boxShadow: 1 }}>
                              {user.username?.[0]?.toUpperCase() || '?'}
                            </Avatar>
                            <Typography fontWeight={500} fontSize={15}>{user.username}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography fontSize={13}>{user.email || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            color={user.role === 'admin' ? 'primary' : user.role === 'manager' ? 'secondary' : 'default'}
                            sx={{ fontWeight: 600, fontSize: 13, px: 1, boxShadow: 0, textTransform: 'capitalize' }}
                            icon={<PersonIcon />}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Yes' : 'No'}
                            color={user.is_active ? 'success' : 'error'}
                            sx={{ fontWeight: 600, fontSize: 13, px: 1, boxShadow: 0 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1.5 } }}>
              <DialogTitle sx={{ fontWeight: 600, fontSize: 18, textAlign: 'center' }}>Add User/Employee</DialogTitle>
              <DialogContent>
                <TextField label="Username" name="username" value={newUser.username} onChange={handleInput} fullWidth sx={{ mb: 1.5 }} />
                <TextField label="Password" name="password" type="password" value={newUser.password} onChange={handleInput} fullWidth sx={{ mb: 1.5 }} />
                <TextField label="Role" name="role" value={newUser.role} onChange={handleInput} fullWidth />
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'center' }}>
                <Button onClick={handleClose} variant="outlined" color="secondary">Cancel</Button>
                <Button onClick={handleAddUser} variant="contained" color="primary">Add</Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
        {tab === 1 && (
          <Box>
            <Typography variant="body1">Other settings and options coming soon.</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Settings;
