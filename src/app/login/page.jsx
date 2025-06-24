'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import BackgroundAnimation from '../../components/BackgroundAnimation';
import LottieSuccess from '../../components/LottieSuccess';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      signIn('google', { callbackUrl: '/dashboard' });
    }, 1500);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        p: 2,
      }}
    >
      <BackgroundAnimation />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 6,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            borderRadius: 3,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
          }}
        >
          {loading ? (
            <Box textAlign="center">
              <LottieSuccess />
              <Typography variant="body1" mt={2}>
                Redirecting...
              </Typography>
            </Box>
          ) : (
            <>
              <Box display="flex" justifyContent="center" mb={2}>
                <Icon icon="ph:shield-check-duotone" width={48} />
              </Box>
              <Typography variant="h4" fontWeight={600} gutterBottom>
                Plagiarism Checker
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={4}>
                Sign in to continue
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<Icon icon="logos:google-icon" width={24} />}
                onClick={handleLogin}
              >
                Continue with Google
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
