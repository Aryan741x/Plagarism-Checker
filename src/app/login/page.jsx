'use client';

import { signIn } from 'next-auth/react';
import { Box, Button, Typography, IconButton, Divider } from '@mui/material';
import { Icon } from '@iconify/react';

export default function LoginPage() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="#f4f6f8">
      <Box sx={{ width: 400, padding: 4, bgcolor: '#fff', borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" textAlign="center" gutterBottom>
          Faculty Login
        </Typography>

        <Divider sx={{ my: 2 }}>OR</Divider>

        <Box display="flex" justifyContent="center">
          <IconButton
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            sx={{ border: '1px solid #ccc', borderRadius: '50%' }}
          >
            <Icon icon="logos:google-icon" width={32} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
