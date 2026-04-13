import twilio from 'twilio';

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP expiry time (5 minutes)
export const getOTPExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 5);
  return expiry;
};

// Verify OTP hasn't expired
export const isOTPValid = (otpExpiry: Date): boolean => {
  return new Date() < otpExpiry;
};

// Send OTP via Twilio SMS
export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  // In development, just log the OTP
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return true;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.error('Twilio credentials not configured');
    // In production without Twilio, still log for testing
    console.log(`[FALLBACK] OTP for ${phone}: ${otp}`);
    return true;
  }

  try {
    const client = twilio(accountSid, authToken);
    
    await client.messages.create({
      body: `Your Fitonze verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
      from: twilioPhone,
      to: `+91${phone}` // Assuming Indian phone numbers
    });

    console.log(`OTP sent successfully to ${phone}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return false;
  }
};

// Format phone number for storage (remove any formatting)
export const formatPhone = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 91 (India country code), remove it
  if (digits.startsWith('91') && digits.length === 12) {
    return digits.slice(2);
  }
  
  // Return last 10 digits
  return digits.slice(-10);
};

// Validate Indian phone number
export const isValidIndianPhone = (phone: string): boolean => {
  const formatted = formatPhone(phone);
  return /^[6-9]\d{9}$/.test(formatted);
};
