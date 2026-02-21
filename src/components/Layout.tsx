


import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import logo from '../assets/jot.png';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/userService';
import { UserContext } from '../context/UserContext';
import { SnackbarProvider } from '../context/SnackbarContext';



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
                <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
                    <Sidebar />
                    <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <AppBar position="sticky" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                            <Toolbar sx={{ px: 2, minHeight: 48, display: 'flex', alignItems: 'center' }}>
                                <img src={logo} alt="Logo" style={{ height: 28, marginRight: 12 }} />
                                <Typography variant="body1" component="div" sx={{ flexGrow: 1, fontWeight: 400, fontSize: 14 }}>
                                    Inventory Management System
                                </Typography>
                                {user && (
                                    <Typography variant="body2" sx={{ ml: 2, fontWeight: 500, fontSize: 12 }}>
                                        Logged in as: {user.username}
                                    </Typography>
                                )}
                            </Toolbar>
                        </AppBar>

                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <Outlet />
                        </Box>
                        <Box component="footer" sx={{ bgcolor: '#222', color: '#fff', py: 1.5, textAlign: 'center', mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={logo} alt="Logo" style={{ height: 24, marginBottom: 6 }} />
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <PhoneIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                    <span style={{ marginLeft: 2 }}>36341106</span>
                                </span>
                                <span style={{ margin: '0 6px' }}>|</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <EmailIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                    <span style={{ marginLeft: 2 }}>jotautopartswll@gmail.com</span>
                                </span>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </UserContext.Provider>
        </SnackbarProvider>
    );
}
