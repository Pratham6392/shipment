import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import axios from 'axios';
import dotenv from 'dotenv';

function App() {
  const [orderDetails, setOrderDetails] = useState({
    orderName: '',
    waybillId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
 
    try {
      const response = await axios.post(`/api/generate-shipping-label`, {
        waybill: orderDetails.waybillId
      }, {
        responseType: 'blob' // Important for handling PDF download
      });

      // Create a blob from the PDF stream
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shipping_label_${orderDetails.waybillId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate shipping label');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          <LocalShippingIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Shipment Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Order Details Form */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Enter Order Details
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Order Name"
                  name="orderName"
                  value={orderDetails.orderName}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Waybill ID"
                  name="waybillId"
                  value={orderDetails.waybillId}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  disabled={loading}
                />
                <Button 
                  variant="contained" 
                  type="submit" 
                  sx={{ mt: 2 }}
                  fullWidth
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Generate Shipping Label'
                  )}
                </Button>
              </form>
            </Paper>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Typography variant="body1">
                  Order Name: {orderDetails.orderName || 'Not specified'}
                </Typography>
                <Typography variant="body1">
                  Waybill ID: {orderDetails.waybillId || 'Not specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;