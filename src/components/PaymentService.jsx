import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFirestoreOperations } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import '../styles/PaymentService.css';

// Initialize Stripe with your publishable key
// In a real app, this would be stored in an environment variable
const stripePromise = loadStripe('pk_test_51NxSamSJME2JMKDPWpIQeKLEDJHINGYOUBOCUNYXXXXXXXXXXXXXX');

// The inner payment form component that uses Stripe hooks
const PaymentForm = ({ 
  amount, 
  currency = 'inr', 
  rideId,
  description = 'Ride payment',
  onSuccess, 
  onError, 
  buttonText = 'Pay Now' 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [saveCard, setSaveCard] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { addDocument, updateDocument, getDocuments } = useFirestoreOperations();

  // Load saved payment methods when component mounts
  useEffect(() => {
    const loadSavedCards = async () => {
      if (user?.uid) {
        try {
          const cards = await getDocuments('paymentMethods', [
            { field: 'userId', operator: '==', value: user.uid },
            { field: 'isDefault', operator: '==', value: true }
          ]);

          if (cards && cards.length > 0) {
            setSavedCards(cards);
            setSelectedCard(cards[0].id);
          }
        } catch (err) {
          console.error('Error loading saved cards:', err);
        }
      }
    };

    loadSavedCards();
  }, [user?.uid, getDocuments]);

  // Create a payment intent when the component mounts or amount changes
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!user?.uid || !amount) return;

      try {
        setLoading(true);

        // In a real implementation, you would call a Firebase function
        // Here we're simulating the response
        const response = {
          clientSecret: 'pi_test_secret_' + Math.random().toString(36).substring(2, 15),
          amount: amount,
          currency: currency
        };

        setClientSecret(response.clientSecret);
        setLoading(false);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
        setLoading(false);
        if (onError) onError(err);
      }
    };

    createPaymentIntent();
  }, [amount, currency, user?.uid, onError]);

  // Handle card element change
  const handleCardChange = (event) => {
    setError(event.error ? event.error.message : '');
    setPaymentMethod(event.complete ? { type: 'card' } : null);
  };

  // Process payment with new card
  const processNewCardPayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      setError('Payment system is not ready. Please try again.');
      return null;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card information is required');
      return null;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName || user?.displayName || 'Anonymous',
            email: user?.email
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // If user chose to save the card
        if (saveCard) {
          try {
            // In a real implementation, you would use Stripe's API to save the payment method
            // Here we're just saving a reference in Firestore
            await addDocument('paymentMethods', {
              userId: user.uid,
              type: 'card',
              last4: '4242', // In a real implementation, this would come from Stripe
              brand: 'Visa', // In a real implementation, this would come from Stripe
              expMonth: 12, // In a real implementation, this would come from Stripe
              expYear: 2025, // In a real implementation, this would come from Stripe
              isDefault: savedCards.length === 0, // Make it default if it's the first card
              createdAt: new Date()
            });
          } catch (saveErr) {
            console.error('Error saving card:', saveErr);
            // We don't fail the payment if saving the card fails
          }
        }

        return paymentIntent.id;
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err) {
      throw err;
    }
  };

  // Process payment with saved card
  const processSavedCardPayment = async () => {
    if (!stripe || !clientSecret || !selectedCard) {
      setError('Payment system is not ready. Please try again.');
      return null;
    }

    try {
      // In a real implementation, you would use the saved payment method ID with Stripe
      // Here we're simulating a successful payment

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate a successful payment intent
      const paymentIntentId = 'pi_' + Math.random().toString(36).substring(2, 15);

      return paymentIntentId;
    } catch (err) {
      throw err;
    }
  };

  // Main payment processing function
  const processPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      if (!user?.uid) {
        throw new Error('You must be logged in to make a payment');
      }

      // Process payment based on whether user is using a saved card or a new one
      const paymentIntentId = selectedCard 
        ? await processSavedCardPayment()
        : await processNewCardPayment();

      if (!paymentIntentId) {
        throw new Error('Payment processing failed');
      }

      console.log(`Payment successful with ID: ${paymentIntentId}`);

      // Create a transaction record in Firestore
      const transactionId = await addDocument('transactions', {
        userId: user.uid,
        rideId: rideId,
        paymentIntentId: paymentIntentId,
        amount,
        currency,
        status: 'completed',
        type: 'payment',
        description,
        paymentMethod: selectedCard || 'new_card',
        createdAt: new Date()
      });

      console.log(`Transaction created with ID: ${transactionId}`);

      // Update user's payment history
      await updateDocument('users', user.uid, {
        paymentHistory: {
          lastPayment: {
            amount,
            currency,
            date: new Date(),
            transactionId
          }
        },
        updatedAt: new Date()
      });

      // If this is a ride payment, update the ride status
      if (rideId) {
        await updateDocument('rides', rideId, {
          paymentStatus: 'completed',
          transactionId,
          updatedAt: new Date()
        });
      }

      setLoading(false);
      if (onSuccess) onSuccess(transactionId);
      return transactionId;
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      setLoading(false);
      if (onError) onError(err);
      return null;
    }
  };

  return (
    <div className="payment-form">
      <h3>Payment Details</h3>

      <div className="payment-amount">
        <span className="amount-label">Amount:</span>
        <span className="amount-value">{currency.toUpperCase()} {amount.toFixed(2)}</span>
      </div>

      {savedCards.length > 0 && (
        <div className="saved-cards">
          <h4>Saved Payment Methods</h4>

          {savedCards.map(card => (
            <div 
              key={card.id} 
              className={`saved-card ${selectedCard === card.id ? 'selected' : ''}`}
              onClick={() => setSelectedCard(card.id)}
            >
              <div className="card-brand">{card.brand}</div>
              <div className="card-last4">**** **** **** {card.last4}</div>
              <div className="card-expiry">Expires {card.expMonth}/{card.expYear}</div>
              {card.isDefault && <div className="default-badge">Default</div>}
            </div>
          ))}

          <button 
            className="use-new-card-button"
            onClick={() => setSelectedCard(null)}
          >
            Use a different card
          </button>
        </div>
      )}

      {!selectedCard && (
        <div className="new-card-form">
          <div className="form-group">
            <label htmlFor="cardholder-name">Cardholder Name</label>
            <input
              id="cardholder-name"
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Name on card"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="card-element">Credit or Debit Card</label>
            <div className="card-element-container">
              <CardElement
                id="card-element"
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
                onChange={handleCardChange}
              />
            </div>
          </div>

          <div className="form-group checkbox">
            <input
              id="save-card"
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
            />
            <label htmlFor="save-card">Save card for future payments</label>
          </div>
        </div>
      )}

      {error && <div className="payment-error">{error}</div>}

      <button 
        className="payment-button" 
        onClick={processPayment} 
        disabled={loading || (!selectedCard && !paymentMethod)}
      >
        {loading ? 'Processing...' : buttonText}
      </button>
    </div>
  );
};

PaymentForm.propTypes = {
  amount: PropTypes.number.isRequired,
  currency: PropTypes.string,
  rideId: PropTypes.string,
  description: PropTypes.string,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  buttonText: PropTypes.string
};

// The main component that wraps the payment form with Stripe Elements
const PaymentService = (props) => {
  return (
    <div className="payment-service">
      <Elements stripe={stripePromise}>
        <PaymentForm {...props} />
      </Elements>
    </div>
  );
};

PaymentService.propTypes = {
  amount: PropTypes.number.isRequired,
  currency: PropTypes.string,
  rideId: PropTypes.string,
  description: PropTypes.string,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  buttonText: PropTypes.string
};

export default PaymentService;
