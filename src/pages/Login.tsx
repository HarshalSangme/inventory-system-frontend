
import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            console.error('Login failed', err);
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white',
                alignItems: 'center'
            }}
        >
            {/* Hero Header - Reduced width for sleeker look */}
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '800px',
                    bgcolor: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    borderBottom: '1px solid #f5f5f5',
                    mt: 2
                }}
            >
                <Box
                    component="img"
                    src="/Invoice_Header.png"
                    alt="Jot Auto Parts"
                    sx={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                    }}
                />
            </Box>

            <Container component="main" maxWidth="xs" sx={{ mt: 6, mb: 6, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <Typography
                        component="h1"
                        variant="h4"
                        align="center"
                        sx={{
                            fontWeight: 800,
                            color: 'var(--jot-charcoal)',
                            mb: 0.5,
                            letterSpacing: '-1px'
                        }}
                    >
                        Welcome Back
                    </Typography>
                    <Typography
                        variant="body1"
                        align="center"
                        color="text.secondary"
                        sx={{ mb: 4, fontWeight: 400 }}
                    >
                        Please sign in to your dashboard
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 4, width: '100%', borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'var(--jot-orange)',
                                    },
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: 'var(--jot-orange)',
                                }
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            onClick={() => setShowPassword((show) => !show)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'var(--jot-orange)',
                                    },
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: 'var(--jot-orange)',
                                }
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 5,
                                mb: 2,
                                background: 'linear-gradient(135deg, var(--jot-orange) 0%, var(--jot-orange-dark) 100%)',
                                py: 1.8,
                                borderRadius: '10px',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                boxShadow: '0 8px 16px rgba(232, 87, 30, 0.15)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, var(--jot-orange-dark) 0%, var(--jot-orange) 100%)',
                                    boxShadow: '0 12px 20px rgba(232, 87, 30, 0.25)',
                                    transform: 'translateY(-1px)'
                                },
                                transition: 'all 0.2s ease-in-out'
                            }}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {loading ? 'Entering...' : 'Sign In'}
                        </Button>

                        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', opacity: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '1px', fontWeight: 600 }}>
                                JOT AUTO PARTS W.L.L &bull; SECURE WORKSPACE
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Login;
