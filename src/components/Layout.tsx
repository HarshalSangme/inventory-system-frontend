
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import logo from '../assets/jot.png';

export default function Layout() {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Sidebar />
            <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AppBar position="sticky" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar sx={{ px: 3, display: 'flex', alignItems: 'center' }}>
                        <img src={logo} alt="Logo" style={{ height: 36, marginRight: 16 }} />
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                            Inventory Management System
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Outlet />
                </Box>
                <Box component="footer" sx={{ bgcolor: '#222', color: '#fff', py: 2, textAlign: 'center', mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={logo} alt="Logo" style={{ height: 32, marginBottom: 8 }} />
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <PhoneIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                            <span style={{ marginLeft: 2 }}>1-36341106</span>
                        </span>
                        <span style={{ margin: '0 8px' }}>|</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <EmailIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                            <span style={{ marginLeft: 2 }}>harjinders717@gmail.com</span>
                        </span>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
