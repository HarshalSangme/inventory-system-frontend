


import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/userService';
import { UserContext } from '../context/UserContext';
import { SnackbarProvider } from '../context/SnackbarContext';
import Chip from '@mui/material/Chip';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

export default function Layout() {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState('');

    useEffect(() => {
        getCurrentUser().then(u => {
            setUser(u);
            setRole(u?.role || '');
        }).catch(() => {
            setUser(null);
            setRole('');
        });
    }, []);

    return (
        <SnackbarProvider>
            <UserContext.Provider value={{ user, role }}>
                <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fbfbfb' }}>
                    <Sidebar />
                    <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: 'calc(100% - 200px)' }}>
                        <AppBar
                            position="sticky"
                            color="inherit"
                            elevation={0}
                            sx={{
                                bgcolor: 'white',
                                borderBottom: '1px solid #f0f0f0',
                                zIndex: (theme) => theme.zIndex.drawer + 1
                            }}
                        >
                            <Toolbar sx={{ px: 3, minHeight: 64 }}>
                                <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{
                                        flexGrow: 1,
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        color: 'var(--jot-charcoal)',
                                        letterSpacing: '-0.5px'
                                    }}
                                >
                                    Inventory Management System
                                </Typography>

                                {user && (
                                    <Chip
                                        icon={<PersonOutlineIcon sx={{ fontSize: '1rem !important' }} />}
                                        label={user.username}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            px: 0.5,
                                            color: 'var(--jot-charcoal)',
                                            borderColor: '#eee',
                                            bgcolor: '#f9f9f9'
                                        }}
                                    />
                                )}
                            </Toolbar>
                        </AppBar>

                        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                            <Outlet />
                        </Box>

                        <Box component="footer" sx={{ bgcolor: 'white', color: 'text.secondary', py: 2, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', mb: 1, color: '#aaa', letterSpacing: '1px' }}>
                                JOT AUTO PARTS W.L.L
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center', fontSize: '0.75rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <PhoneIcon sx={{ fontSize: 13, color: 'var(--jot-orange)' }} />
                                    <span>36341106</span>
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <EmailIcon sx={{ fontSize: 13, color: 'var(--jot-orange)' }} />
                                    <span>jotautopartswll@gmail.com</span>
                                </span>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </UserContext.Provider>
        </SnackbarProvider>
    );
}
