import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import logo from '../assets/jot.png';
import Toolbar from '@mui/material/Toolbar';
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

const SidebarItems = () => {
    const location = useLocation();

    return (
        <List dense sx={{
            px: 1.5,
            '& .MuiListItemButton-root': {
                borderRadius: '8px',
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                    bgcolor: 'var(--jot-orange)',
                    color: 'white',
                    '&:hover': {
                        bgcolor: 'var(--jot-orange-dark)',
                    },
                    '& .MuiListItemIcon-root': {
                        color: 'white',
                    }
                },
                '&:hover:not(.Mui-selected)': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                }
            }
        }}>
            {items.map((it) => (
                <ListItem key={it.path} disablePadding>
                    <ListItemButton
                        component={RouterLink}
                        to={it.path}
                        selected={location.pathname === it.path}
                    >
                        <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 36 }}>
                            {it.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={it.label}
                            primaryTypographyProps={{
                                fontWeight: location.pathname === it.path ? 600 : 400,
                                fontSize: '0.85rem'
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    );
};

export default function Sidebar() {
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
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    bgcolor: 'var(--jot-charcoal)',
                    color: 'white',
                    borderRight: 'none',
                    boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
                },
            }}
        >
            <Toolbar sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 3,
                px: 2,
                minHeight: 100
            }}>
                <Box
                    sx={{
                        bgcolor: 'white',
                        p: 1,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.5,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                >
                    <img src={logo} alt="Logo" style={{ height: 32 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textAlign: 'center' }}>
                    JOT AUTO PARTS W.L.L
                </Typography>
            </Toolbar>

            <Box sx={{ mt: 2 }}>
                <SidebarItems />
            </Box>

            <Box sx={{ flex: 1 }} />

            <Box sx={{ p: 1.5, mb: 1 }}>
                <List dense sx={{
                    '& .MuiListItemButton-root': {
                        borderRadius: '8px',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.08)',
                        }
                    }
                }}>
                    <ListItem disablePadding>
                        <ListItemButton onClick={handleSettings}>
                            <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 36 }}><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.85rem' }} />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={handleLogout}>
                            <ListItemIcon sx={{ color: 'rgba(211, 47, 47, 0.8)', minWidth: 36 }}><LogoutIcon /></ListItemIcon>
                            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.85rem' }} />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Drawer>
    );
}
