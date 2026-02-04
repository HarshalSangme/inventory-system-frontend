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

const drawerWidth = 240;

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
                py: 3,
                px: 2,
                minHeight: 120
            }}>
                <img src={logo} alt="Logo" style={{ height: 56, marginBottom: 10, marginTop: 4 }} />
                <Box component="span" sx={{ fontWeight: 700, fontSize: 20, textAlign: 'center', lineHeight: 1.2 }}>
                    JOT AUTO PARTS W.L.L
                </Box>
            </Toolbar>
            <Divider />
            <List>
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
            <Box sx={{ p: 1 }}>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton>
                            <ListItemIcon><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Settings" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton>
                            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Drawer>
    );
}
