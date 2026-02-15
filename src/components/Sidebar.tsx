import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import logo from '../assets/jot.png';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import BarChartIcon from '@mui/icons-material/BarChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const drawerWidth = 200;

const items = [
    { icon: <Inventory2Icon />, label: 'Dashboard', path: '/' },
    { icon: <PeopleIcon />, label: 'Customers', path: '/customers' },
    { icon: <PeopleIcon />, label: 'Vendors', path: '/vendors' },
    { icon: <StorefrontIcon />, label: 'Products', path: '/products' },
    { icon: <SellIcon />, label: 'Sales', path: '/sales' },
    { icon: <ShoppingCartIcon />, label: 'Purchases', path: '/purchases' },
    { icon: <PictureAsPdfIcon />, label: 'Invoices', path: '/invoices' },
    { icon: <BarChartIcon />, label: 'Reports', path: '/reports' },
];

export default function Sidebar() {
    const location = useLocation();
    const handleSettings = () => {
        window.location.href = '/settings';
    };
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
            }}
        >
            <Toolbar sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 1.5,
                px: 1.5,
                minHeight: 80
            }}>
                <img src={logo} alt="Logo" style={{ height: 36, marginBottom: 6 }} />
                <Box component="span" sx={{ fontWeight: 400, fontSize: 14, textAlign: 'center', lineHeight: 1.2 }}>
                    JOT AUTO PARTS W.L.L
                </Box>
            </Toolbar>
            <Divider />
            <List dense sx={{ '& .MuiListItemButton-root': { py: 0.5, minHeight: 36 }, '& .MuiListItemIcon-root': { minWidth: 36 }, '& .MuiListItemText-primary': { fontSize: 13 }, '& .MuiSvgIcon-root': { fontSize: 18 } }}>
                {items.map((it) => (
                    <ListItem key={it.path} disablePadding>
                        <ListItemButton component={RouterLink} to={it.path} selected={location.pathname === it.path}>
                            <ListItemIcon>{it.icon}</ListItemIcon>
                            <ListItemText primary={it.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Box sx={{ flex: 1 }} />
            <Divider />
            <Box sx={{ p: 0.5 }}>
                <List dense sx={{ '& .MuiListItemButton-root': { py: 0.5, minHeight: 36 }, '& .MuiListItemIcon-root': { minWidth: 36 }, '& .MuiListItemText-primary': { fontSize: 13 }, '& .MuiSvgIcon-root': { fontSize: 18 } }}>
                    <ListItem disablePadding>
                        <ListItemButton onClick={handleSettings}>
                            <ListItemIcon><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Settings" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={handleLogout}>
                            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Drawer>
    );
}
