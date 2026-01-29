import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function Layout() {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Sidebar />
            <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AppBar position="sticky" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar sx={{ px: 3 }}>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                            Inventory Management System
                        </Typography>
                        <Box sx={{ width: 40, height: 40, bgcolor: 'grey.300', borderRadius: '50%' }} />
                    </Toolbar>
                </AppBar>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
