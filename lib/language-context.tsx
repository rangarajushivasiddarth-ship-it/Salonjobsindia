'use client'

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react'

export type Language = 'English' | 'Hindi' | 'Telugu' | 'Tamil' | 'Kannada' | 'Gujarati' | 'Malayalam' | 'Marathi' | 'Urdu'

interface LanguageContextType {
  currentLanguage: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation data for all supported languages
const translations: Record<Language, Record<string, string>> = {
  English: {
    // Navigation & Common
    'nav.home': 'Home',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.about': 'About Us',
    
    // Auth
    'auth.title': 'Welcome Back',
    'auth.createAccount': 'Create Account',
    'auth.signInSubtitle': 'Sign In to continue',
    'auth.signUpSubtitle': 'Sign Up to get started',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.phone': 'Phone Number',
    'auth.name': 'Full Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.alreadyHaveAccount': 'Already have an account?',
    
    // Role Selection
    'role.selectRole': 'Select Your Role',
    'role.jobSeeker': 'Job Seeker',
    'role.salonOwner': 'Salon Owner',
    'role.employer': 'Employer',
    
    // Job Discovery
    'job.search': 'Search salons...',
    'job.filter': 'Filter',
    'job.salary': 'Salary',
    'job.experience': 'Experience',
    'job.location': 'Location',
    'job.unlock': 'Unlock',
    'job.message': 'Message',
    'job.apply': 'Apply Now',
    'job.saved': 'Saved',
    'job.unsave': 'Unsave',
    'job.rating': 'Rating',
    'job.reviews': 'reviews',
    'job.distance': 'Distance',
    'job.accommodation': 'Accommodation',
    'job.foodProvided': 'Food Provided',
    
    // Resume
    'resume.title': 'Build Your Resume',
    'resume.name': 'Full Name',
    'resume.role': 'Position',
    'resume.experience': 'Years of Experience',
    'resume.skills': 'Skills',
    'resume.salary': 'Expected Salary',
    'resume.location': 'Location',
    'resume.continue': 'Continue',
    
    // Settings
    'settings.title': 'Settings',
    'settings.editProfile': 'Edit Profile',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.help': 'Help & Support',
    'settings.language': 'Language',
    'settings.darkMode': 'Dark Mode',
    'settings.logout': 'Logout',
    'settings.jobAlerts': 'Job Alerts',
    'settings.messages': 'Messages',
    'settings.promotions': 'Promotions',
    'settings.reminders': 'Reminders',
    
    // General
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.remember': 'Remember',
  },

  Hindi: {
    // Navigation & Common
    'nav.home': 'होम',
    'nav.messages': 'संदेश',
    'nav.notifications': 'सूचनाएं',
    'nav.profile': 'प्रोफाइल',
    'nav.settings': 'सेटिंग्स',
    'nav.about': 'हमारे बारे में',
    
    // Auth
    'auth.title': 'वापस स्वागत है',
    'auth.createAccount': 'खाता बनाएं',
    'auth.signInSubtitle': 'जारी रखने के लिए साइन इन करें',
    'auth.signUpSubtitle': 'शुरुआत करने के लिए साइन अप करें',
    'auth.signIn': 'साइन इन',
    'auth.signUp': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.phone': 'फोन नंबर',
    'auth.name': 'पूरा नाम',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    'auth.dontHaveAccount': 'खाता नहीं है?',
    'auth.alreadyHaveAccount': 'पहले से ही खाता है?',
    
    // Role Selection
    'role.selectRole': 'अपनी भूमिका चुनें',
    'role.jobSeeker': 'नौकरी चाहने वाला',
    'role.salonOwner': 'सैलून मालिक',
    'role.employer': 'नियोक्ता',
    
    // Job Discovery
    'job.search': 'सैलून खोजें...',
    'job.filter': 'फ़िल्टर',
    'job.salary': 'वेतन',
    'job.experience': 'अनुभव',
    'job.location': 'स्थान',
    'job.unlock': 'अनलॉक करें',
    'job.message': 'संदेश',
    'job.apply': 'अभी आवेदन करें',
    'job.saved': 'सहेजा गया',
    'job.unsave': 'अनसेव करें',
    'job.rating': 'रेटिंग',
    'job.reviews': 'समीक्षाएं',
    'job.distance': 'दूरी',
    'job.accommodation': 'आवास',
    'job.foodProvided': 'भोजन प्रदान किया',
    
    // Resume
    'resume.title': 'अपना रिज्यूमे बनाएं',
    'resume.name': 'पूरा नाम',
    'resume.role': 'पद',
    'resume.experience': 'अनुभव के वर्ष',
    'resume.skills': 'कौशल',
    'resume.salary': 'अपेक्षित वेतन',
    'resume.location': 'स्थान',
    'resume.continue': 'जारी रखें',
    
    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.editProfile': 'प्रोफाइल संपादित करें',
    'settings.notifications': 'सूचनाएं',
    'settings.privacy': 'गोपनीयता',
    'settings.help': 'सहायता और समर्थन',
    'settings.language': 'भाषा',
    'settings.darkMode': 'डार्क मोड',
    'settings.logout': 'लॉगआउट',
    'settings.jobAlerts': 'नौकरी सतर्कता',
    'settings.messages': 'संदेश',
    'settings.promotions': 'प्रचार',
    'settings.reminders': 'अनुस्मारक',
    
    // General
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.back': 'वापस',
    'common.next': 'आगे',
    'common.remember': 'याद रखें',
  },

  Telugu: {
    // Navigation & Common
    'nav.home': 'హోమ్',
    'nav.messages': 'సందేశాలు',
    'nav.notifications': 'నోటిఫికేషన్‌లు',
    'nav.profile': 'ప్రొఫైల్',
    'nav.settings': 'సెట్టింగ్‌లు',
    'nav.about': 'ჩვენს గురించి',
    
    // Auth
    'auth.title': 'తిరిగి స్వాగతం',
    'auth.createAccount': 'ఖాతా సృష్టించండి',
    'auth.signInSubtitle': 'కొనసాగించడానికి సైన్ ఇన్ చేయండి',
    'auth.signUpSubtitle': 'ప్రారంభించడానికి సైన్ అప్ చేయండి',
    'auth.signIn': 'సైన్ ఇన్ చేయి',
    'auth.signUp': 'సైన్ అప్ చేయి',
    'auth.email': 'ఇమెయిల్',
    'auth.password': 'పాస్‌వర్డ్',
    'auth.phone': 'ఫోన్ నంబర్',
    'auth.name': 'పూర్తి పేరు',
    'auth.forgotPassword': 'పాస్‌వర్డ్ మరిచిపోయారా?',
    'auth.dontHaveAccount': 'ఖాతా లేదు?',
    'auth.alreadyHaveAccount': 'ఇప్పటికే ఖాతా ఉందా?',
    
    // Role Selection
    'role.selectRole': 'మీ పాత్ర ఎంచుకోండి',
    'role.jobSeeker': 'ఉద్యోగ చేత వెతుకుతున్నవాడు',
    'role.salonOwner': 'సెలూన్ యజమాని',
    'role.employer': 'యజమాని',
    
    // Job Discovery
    'job.search': 'సెలూన్‌లను కనుగొనండి...',
    'job.filter': 'ఫిల్టర్',
    'job.salary': 'జీతం',
    'job.experience': 'అనుభవం',
    'job.location': 'ప్రదేశం',
    'job.unlock': 'అన్‌లాక్ చేయండి',
    'job.message': 'సందేశం',
    'job.apply': 'ఇప్పుడు దరఖాస్తు చేయండి',
    'job.saved': 'సేవ్ చేయబడిన',
    'job.unsave': 'సేవ్ చేయవద్దు',
    'job.rating': 'రేటింగ్',
    'job.reviews': 'సమీక్షలు',
    'job.distance': 'దూరం',
    'job.accommodation': 'బస నివాసం',
    'job.foodProvided': 'ఆహారం అందించినది',
    
    // Resume
    'resume.title': 'మీ రెసమ్‌ను నిర్మించండి',
    'resume.name': 'పూర్తి పేరు',
    'resume.role': 'స్థానం',
    'resume.experience': 'సంవత్సరాల అనుభవం',
    'resume.skills': 'నైపుణ్యాలు',
    'resume.salary': 'ఆశించిన జీతం',
    'resume.location': 'ప్రదేశం',
    'resume.continue': 'కొనసాగించండి',
    
    // Settings
    'settings.title': 'సెట్టింగ్‌లు',
    'settings.editProfile': 'ప్రొఫైల్ సవరించండి',
    'settings.notifications': 'నోటిఫికేషన్‌లు',
    'settings.privacy': 'గోపనీయత',
    'settings.help': 'సహాయం & మద్దతు',
    'settings.language': 'భాష',
    'settings.darkMode': 'డార్క్ మోడ్',
    'settings.logout': 'లాగ్ అవుట్',
    'settings.jobAlerts': 'ఉద్యోగ హెచ్చరికలు',
    'settings.messages': 'సందేశాలు',
    'settings.promotions': 'ప్రచారాలు',
    'settings.reminders': 'రిమైండర్‌లు',
    
    // General
    'common.save': 'సేవ్ చేయండి',
    'common.cancel': 'రద్దు చేయండి',
    'common.delete': 'తొలగించండి',
    'common.edit': 'సవరించండి',
    'common.loading': 'లోడ్ చేస్తోంది...',
    'common.error': 'ఎర్రర్',
    'common.success': 'సఫలం',
    'common.back': 'వెనుకకు',
    'common.next': 'తరువాత',
    'common.remember': 'గుర్తుంచుకోండి',
  },

  Tamil: {
    // Navigation & Common
    'nav.home': 'முகப்பு',
    'nav.messages': 'செய்திகள்',
    'nav.notifications': 'அறிவிப்புகள்',
    'nav.profile': 'சுயவிவரம்',
    'nav.settings': 'அமைப்புகள்',
    'nav.about': 'எங்களைப் பற்றி',
    
    // Auth
    'auth.title': 'மீண்டும் வரவேற்கிறோம்',
    'auth.createAccount': 'கணக்கு உருவாக்கவும்',
    'auth.signInSubtitle': 'தொடர சைன் இன் செய்யவும்',
    'auth.signUpSubtitle': 'தொடங்க சைன் அப் செய்யவும்',
    'auth.signIn': 'சைன் இன்',
    'auth.signUp': 'சைன் அப்',
    'auth.email': 'ஈமெயில்',
    'auth.password': 'கடவுசொல்',
    'auth.phone': 'ফোன் எண்',
    'auth.name': 'முழு பெயர்',
    'auth.forgotPassword': 'கடவுசொல் மறந்துவிட்டீர்களா?',
    'auth.dontHaveAccount': 'கணக்கு இல்லையா?',
    'auth.alreadyHaveAccount': 'ஏற்கனவே கணக்கு உள்ளதா?',
    
    // Role Selection
    'role.selectRole': 'உங்கள் பாத்திரத்தைத் தேர்ந்தெடுக்கவும்',
    'role.jobSeeker': 'வேலை தேடுபவர்',
    'role.salonOwner': 'சலூன் உரிமையாளர்',
    'role.employer': 'முதலாளி',
    
    // Job Discovery
    'job.search': 'சலூன்களைத் தேடுக...',
    'job.filter': 'வடிகட்டி',
    'job.salary': 'சம்பளம்',
    'job.experience': 'அனுபவம்',
    'job.location': 'இடம்',
    'job.unlock': 'திறக்கவும்',
    'job.message': 'செய்தி',
    'job.apply': 'இப்போது விண்ணப்பிக்கவும்',
    'job.saved': 'சேமிக்கப்பட்டது',
    'job.unsave': 'சேமிக்க வேண்டாம்',
    'job.rating': 'மதிப்பீடு',
    'job.reviews': 'விமர்சனங்கள்',
    'job.distance': 'தொலைவு',
    'job.accommodation': 'தங்குமிடம்',
    'job.foodProvided': 'உணவு வழங்கப்பட்டது',
    
    // Resume
    'resume.title': 'உங்கள் பயணலிலக்கை உருவாக்கவும்',
    'resume.name': 'முழு பெயர்',
    'resume.role': 'பணி',
    'resume.experience': 'அனுபவ வருடங்கள்',
    'resume.skills': 'திறன்கள்',
    'resume.salary': 'எதிர்பார்க்கப்பட்ட சம்பளம்',
    'resume.location': 'இடம்',
    'resume.continue': 'தொடரவும்',
    
    // Settings
    'settings.title': 'அமைப்புகள்',
    'settings.editProfile': 'சுயவிவரத்தை திருத்தவும்',
    'settings.notifications': 'அறிவிப்புகள்',
    'settings.privacy': 'தனியுரிமை',
    'settings.help': 'உதவி மற்றும் ஆதரவு',
    'settings.language': 'மொழி',
    'settings.darkMode': 'இருண்ட பயன்முறை',
    'settings.logout': 'வெளியேறு',
    'settings.jobAlerts': 'வேலை விழிப்பூட்டல்கள்',
    'settings.messages': 'செய்திகள்',
    'settings.promotions': 'விளம்பரங்கள்',
    'settings.reminders': 'நினைவூட்டல்கள்',
    
    // General
    'common.save': 'சேமிக்கவும்',
    'common.cancel': 'ரத்து செய்க',
    'common.delete': 'அழிக்கவும்',
    'common.edit': 'திருத்தவும்',
    'common.loading': 'சுமைகிறது...',
    'common.error': 'பிழை',
    'common.success': 'வெற்றி',
    'common.back': 'பின்னால்',
    'common.next': 'அடுத்தது',
    'common.remember': 'நினைவில் வைக்க',
  },

  Kannada: {
    // Navigation & Common
    'nav.home': 'ಮನೆ',
    'nav.messages': 'ಸಂದೇಶಗಳು',
    'nav.notifications': 'ಅಧಿಸೂಚನೆಗಳು',
    'nav.profile': 'ಪ್ರೊಫೈಲ್',
    'nav.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'nav.about': 'ನಮ್ಮ ಬಗ್ಗೆ',
    
    // Auth
    'auth.title': 'ಸ್ವಾಗತಮ್ನ ಹಿಂತಿರುಗುವಿಕೆ',
    'auth.signIn': 'ಸೈನ್ ಇನ್ ಮಾಡಿ',
    'auth.signUp': 'ಸೈನ್ ಅಪ್ ಮಾಡಿ',
    'auth.email': 'ಇಮೇಲ್',
    'auth.password': 'ಪಾಸ್‌ವರ್ಡ್',
    'auth.phone': 'ಫೋನ್ ಸಂಖ್ಯೆ',
    'auth.name': 'ಪೂರ್ಣ ಹೆಸರು',
    'auth.forgotPassword': 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತುಬಿದ್ದೀರಾ?',
    'auth.dontHaveAccount': 'ಖಾತೆ ಇಲ್ಲವೇ?',
    'auth.alreadyHaveAccount': 'ಈಗಾಗಲ�� ಖಾತೆ ಇದೆಯೇ?',
    'auth.createAccount': 'ಖಾತೆ ರಚಿಸಿ',
    'auth.signInSubtitle': 'ಮುಂದುವರೆಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ',
    'auth.signUpSubtitle': 'ಪ್ರಾರಂಭಿಸಲು ಸೈನ್ ಅಪ್ ಮಾಡಿ',
    
    // Role Selection
    'role.selectRole': 'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆರಿಸಿ',
    'role.jobSeeker': 'ಉದ್ಯೋಗ ಹೋಲಾಟಕಾರ',
    'role.salonOwner': 'ಸ್ಯಾಲೂನ್ ಮಾಲೀಕ',
    'role.employer': 'ನೇಮಕಾತ್ತ',
    
    // Job Discovery
    'job.search': 'ಸ್ಯಾಲೂನ್‌ಗಳನ್ನು ಹುಡುಕಿ...',
    'job.filter': 'ಫಿಲ್��ರ್',
    'job.salary': 'ಸಂಬಳ',
    'job.experience': 'ಅನುಭವ',
    'job.location': 'ಸ್ಥಳ',
    'job.unlock': 'ಅನ್‌ಲಾಕ್ ಮಾಡಿ',
    'job.message': 'ಸಂದೇಶ',
    'job.apply': 'ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
    'job.saved': 'ಉಳಿಸಲಾಗಿದೆ',
    'job.unsave': 'ಅನ್ಸೇವ್ ಮಾಡಿ',
    'job.rating': 'ರೇಟಿಂಗ್',
    'job.reviews': 'ವಿಮರ್ಶೆಗಳು',
    'job.distance': 'ಅಂತರ',
    'job.accommodation': 'ಆವಾಸವ್ಯವಸ್ಥೆ',
    'job.foodProvided': 'ಆಹಾರ ವಿತರಿಸಲಾಗಿದೆ',
    
    // Resume
    'resume.title': 'ನಿಮ್ಮ ರೆಸ್ಯೂಮೆ ನಿರ್ಮಿಸಿ',
    'resume.name': 'ಪೂರ್ಣ ಹೆಸರು',
    'resume.role': 'ಸ್ಥಾನ',
    'resume.experience': 'ಅನುಭವದ ವರ್ಷಗಳು',
    'resume.skills': 'ಕೌಶಲ್ಯಗಳು',
    'resume.salary': 'ನಿರೀಕ್ಷಿತ ಸಂಬಳ',
    'resume.location': 'ಸ್ಥಳ',
    'resume.continue': 'ಮುಂದುವರಿಸಿ',
    
    // Settings
    'settings.title': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'settings.editProfile': 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
    'settings.notifications': 'ಅಧಿಸೂಚನೆಗಳು',
    'settings.privacy': 'ಗೋಪ್ಯತೆ',
    'settings.help': 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ',
    'settings.language': 'ಭಾಷೆ',
    'settings.darkMode': 'ಡಾರ್ಕ್ ಮೋಡ್',
    'settings.logout': 'ಲಾಗ್ ಔಟ್',
    'settings.jobAlerts': 'ಉದ್ಯೋಗ ಸೂಚನೆಗಳು',
    'settings.messages': 'ಸಂದೇಶಗಳು',
    'settings.promotions': 'ಪ್ರಚಾರಗಳು',
    'settings.reminders': 'ಜ್ಞಾಪಕಗಳು',
    
    // General
    'common.save': 'ಉಳಿಸಿ',
    'common.cancel': 'ರದ್ದುಗೊಳಿಸಿ',
    'common.delete': 'ಅಳಿಸಿ',
    'common.edit': 'ಸಂಪಾದಿಸಿ',
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'common.error': 'ಲೋಪ',
    'common.success': 'ಯಶಸ್ವಿ',
    'common.back': 'ಹಿಂದೆ',
    'common.next': 'ಮುಂದೆ',
    'common.remember': 'ನೆನಪಿಡಿ',
  },

  Gujarati: {
    // Navigation & Common
    'nav.home': 'હોમ',
    'nav.messages': 'સંદેશો',
    'nav.notifications': 'સૂચનાઓ',
    'nav.profile': 'પ્રોફાઈલ',
    'nav.settings': 'સેટિંગ્સ',
    'nav.about': 'આমારા વિશે',
    
    // Auth
    'auth.title': 'પાછા આવીને સ્વાગત છે',
    'auth.createAccount': 'ખાતું બનાવો',
    'auth.signInSubtitle': 'ચાલુ રાખવા માટે સાઇન ઇન કરો',
    'auth.signUpSubtitle': 'શરુ કરવા માટે સાઇન અપ કરો',
    'auth.signIn': 'સાઇન ઇન કરો',
    'auth.signUp': 'સાઇન અપ કરો',
    'auth.email': 'ઈમેલ',
    'auth.password': 'પાસવર્ડ',
    'auth.phone': 'ફોન નંબર',
    'auth.name': 'સંપૂર્ણ નામ',
    'auth.forgotPassword': 'પાસવર્ડ ભૂલી ગયા?',
    'auth.dontHaveAccount': 'ખાતું નથી?',
    'auth.alreadyHaveAccount': 'પહેલાથી ખાતું છે?',
    
    // Role Selection
    'role.selectRole': 'તમારી ભૂમિકા પસંદ કરો',
    'role.jobSeeker': 'નોકરી શોધી રહેલો',
    'role.salonOwner': 'સલૂન માલક',
    'role.employer': 'નોકરીદાતા',
    
    // Job Discovery
    'job.search': 'સલૂનો શોધો...',
    'job.filter': 'ફિલ્ટર',
    'job.salary': 'પગાર',
    'job.experience': 'અનુભવ',
    'job.location': 'સ્થાન',
    'job.unlock': 'અનલૉક કરો',
    'job.message': 'સંદેશ',
    'job.apply': 'હવે અરજી કરો',
    'job.saved': 'સુરક્ષિત કર્યું',
    'job.unsave': 'અનસેવ કરો',
    'job.rating': 'રેટિંગ',
    'job.reviews': 'રીવ્યુ',
    'job.distance': 'અંતર',
    'job.accommodation': 'આવાસ',
    'job.foodProvided': 'ખોરાક આપવામાં આવ્યો',
    
    // Resume
    'resume.title': 'તમારું રિઝ્યુમે બનાવો',
    'resume.name': 'સંપૂર્ણ નામ',
    'resume.role': 'પદ',
    'resume.experience': 'અનુભવના વર્ષો',
    'resume.skills': 'કૌશલ્ય',
    'resume.salary': 'અપેક્ષિત પગાર',
    'resume.location': 'સ્થાન',
    'resume.continue': 'ચાલુ રાખો',
    
    // Settings
    'settings.title': 'સેટિંગ્સ',
    'settings.editProfile': 'પ્રોફાઈલ સંપાદિત કરો',
    'settings.notifications': 'સૂચનાઓ',
    'settings.privacy': 'ગોપનીયતા',
    'settings.help': 'મદદ અને સમર્થન',
    'settings.language': 'ભાષા',
    'settings.darkMode': 'ડાર્ક મોડ',
    'settings.logout': 'લૉગ આઉટ',
    'settings.jobAlerts': 'નોકરી સતર્કતાઓ',
    'settings.messages': 'સંદેશો',
    'settings.promotions': 'પ્રમોશનો',
    'settings.reminders': 'રીમાઈન્ડર્સ',
    
    // General
    'common.save': 'સુરક્ષિત કરો',
    'common.cancel': 'રદ્દ કરો',
    'common.delete': 'કાઢી નાખો',
    'common.edit': 'સંપાદિત કરો',
    'common.loading': 'લોડ થઈ રહ્યું છે...',
    'common.error': 'ભૂલ',
    'common.success': 'સફળતા',
    'common.back': 'પાછળ',
    'common.next': 'આગલું',
    'common.remember': 'યાદ રાખો',
  },

  Malayalam: {
    // Navigation & Common
    'nav.home': 'ഹോം',
    'nav.messages': 'സന്ദേശങ്ങൾ',
    'nav.notifications': 'അറിയിപ്പുകൾ',
    'nav.profile': 'പ്രൊഫൈൽ',
    'nav.settings': 'സെറ്റിംഗ്‌സ്',
    'nav.about': 'ഞങ്ങളെ പറ്റി',
    
    // Auth
    'auth.title': 'സ്വാഗതം ഫിരിയെത്തിയതിന്',
    'auth.createAccount': 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    'auth.signInSubtitle': 'തുടരുന്നതിന് സൈൻ ഇൻ ചെയ്യുക',
    'auth.signUpSubtitle': 'തുടങ്ങാൻ സൈൻ അപ്പ് ചെയ്യുക',
    'auth.signIn': 'സൈൻ ഇൻ ചെയ്യുക',
    'auth.signUp': 'സൈൻ അപ്പ് ചെയ്യുക',
    'auth.email': 'ഇമെയിൽ',
    'auth.password': 'പാസ്‌വേഡ്',
    'auth.phone': 'ഫോൻ നമ്പർ',
    'auth.name': 'പൂർണ്ണ നാമം',
    'auth.forgotPassword': 'പാസ്‌വേഡ് മറന്നുവോ?',
    'auth.dontHaveAccount': 'അക്കൗണ്ട് ഇല്ലയോ?',
    'auth.alreadyHaveAccount': 'ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?',
    
    // Role Selection
    'role.selectRole': 'നിങ്ങളുടെ വാത്സല്യം തിരഞ്ഞെടുക്കുക',
    'role.jobSeeker': 'ജോലി അന്വേഷകൻ',
    'role.salonOwner': 'സ്കൂൾ ഉടമ',
    'role.employer': 'തൊഴിലുടമ',
    
    // Job Discovery
    'job.search': 'സലൂണുകൾ തിരയുക...',
    'job.filter': 'ഫിൽട്ടർ',
    'job.salary': 'വേതനം',
    'job.experience': 'അനുഭവം',
    'job.location': 'സ്ഥലം',
    'job.unlock': 'അൺലോക്ക് ചെയ്യുക',
    'job.message': 'സന്ദേശം',
    'job.apply': 'ഇപ്പോൾ അപേക്ഷ ചെയ്യുക',
    'job.saved': 'സംരക്ഷിതം',
    'job.unsave': 'സംരക്ഷിക്കാതെ ഇടുക',
    'job.rating': 'റേറ്റിംഗ്',
    'job.reviews': 'അവലോകനങ്ങൾ',
    'job.distance': 'ദൂരം',
    'job.accommodation': 'താമസ സ്ഥലം',
    'job.foodProvided': 'ഭക്ഷണം നൽകിയിരിക്കുന്നു',
    
    // Resume
    'resume.title': 'നിങ്ങളുടെ രെസിയുമെ തയാറാക്കുക',
    'resume.name': 'പൂർണ്ണ നാമം',
    'resume.role': 'സ്ഥാനം',
    'resume.experience': 'അനുഭവ വർഷങ്ങൾ',
    'resume.skills': 'കഴിവുകൾ',
    'resume.salary': 'പ്രതീക്ഷിത വേതനം',
    'resume.location': 'സ്ഥലം',
    'resume.continue': 'തുടരുക',
    
    // Settings
    'settings.title': 'സെറ്റിംഗ്‌സ്',
    'settings.editProfile': 'പ്രൊഫൈൽ തിരുത്തുക',
    'settings.notifications': 'അറിയിപ്പുകൾ',
    'settings.privacy': 'സ്വകാര്യത',
    'settings.help': 'സഹായം ആണ് പിന്തുണ',
    'settings.language': 'ഭാഷ',
    'settings.darkMode': 'ഇരുണ്ട മോഡ്',
    'settings.logout': 'ലോഗ് ഔട്ട്',
    'settings.jobAlerts': 'ജോലി അലർട്ടുകൾ',
    'settings.messages': 'സന്ദേശങ്ങൾ',
    'settings.promotions': 'പ്രമോഷനുകൾ',
    'settings.reminders': 'സ്മരണകൾ',
    
    // General
    'common.save': 'സംരക്ഷിക്കുക',
    'common.cancel': 'റദ്ദാക്കുക',
    'common.delete': 'ഇല്ലാതാക്കുക',
    'common.edit': 'തിരുത്തുക',
    'common.loading': 'ലോഡ് ചെയ്യുന്നു...',
    'common.error': 'പിശക്',
    'common.success': 'വിജയം',
    'common.back': 'പിന്നിലേക്ക്',
    'common.next': 'അടുത്തത്',
    'common.remember': 'ഓർക്കുക',
  },

  Marathi: {
    // Navigation & Common
    'nav.home': 'मुख्य पृष्ठ',
    'nav.messages': 'संदेश',
    'nav.notifications': 'सूचना',
    'nav.profile': 'प्रोफाइल',
    'nav.settings': 'सेटिंग',
    'nav.about': 'आमच्या बद्दल',
    
    // Auth
    'auth.title': 'पुन्हा स्वागत आहे',
    'auth.createAccount': 'खाते तयार करा',
    'auth.signInSubtitle': 'सुरू ठेवण्यासाठी साइन इन करा',
    'auth.signUpSubtitle': 'सुरुवात करण्यासाठी साइन अप करा',
    'auth.signIn': 'साइन इन करा',
    'auth.signUp': 'साइन अप करा',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.phone': 'फोन नंबर',
    'auth.name': 'पूर्ण नाव',
    'auth.forgotPassword': 'पासवर्ड विसरलात?',
    'auth.dontHaveAccount': 'खाते नाही का?',
    'auth.alreadyHaveAccount': 'आधीच खाते आहे का?',
    
    // Role Selection
    'role.selectRole': 'आपली भूमिका निवडा',
    'role.jobSeeker': 'नोकरी शोधणारा',
    'role.salonOwner': 'सलून मालक',
    'role.employer': 'नियोक्ता',
    
    // Job Discovery
    'job.search': 'सलून शोधा...',
    'job.filter': 'फिल्टर',
    'job.salary': 'वेतन',
    'job.experience': 'अनुभव',
    'job.location': 'स्थान',
    'job.unlock': 'अनलॉक करा',
    'job.message': 'संदेश',
    'job.apply': 'आता अर्ज करा',
    'job.saved': 'सेव केले',
    'job.unsave': 'अनसेव करा',
    'job.rating': 'रेटिंग',
    'job.reviews': 'समीक्षा',
    'job.distance': 'अंतर',
    'job.accommodation': 'राहण्याचे सुविधा',
    'job.foodProvided': 'खाना दिला',
    
    // Resume
    'resume.title': 'आपले रेज्यूमे बनवा',
    'resume.name': 'पूर्ण नाव',
    'resume.role': 'पद',
    'resume.experience': 'अनुभवाचे वर्ष',
    'resume.skills': 'कौशल्य',
    'resume.salary': 'अपेक्षित वेतन',
    'resume.location': 'स्थान',
    'resume.continue': 'सुरू ठेवा',
    
    // Settings
    'settings.title': 'सेटिंग',
    'settings.editProfile': 'प्रोफाइल संपादित करा',
    'settings.notifications': 'सूचना',
    'settings.privacy': 'गोपनीयता',
    'settings.help': 'मदत आणि समर्थन',
    'settings.language': 'भाषा',
    'settings.darkMode': 'गडद मोड',
    'settings.logout': 'लॉग आउट',
    'settings.jobAlerts': 'नोकरीची सतर्कता',
    'settings.messages': 'संदेश',
    'settings.promotions': 'प्रचार',
    'settings.reminders': 'स्मरणे',
    
    // General
    'common.save': 'सेव करा',
    'common.cancel': 'रद्द करा',
    'common.delete': 'हटवा',
    'common.edit': 'संपादित करा',
    'common.loading': 'लोड होत आहे...',
    'common.error': 'त्रुटी',
    'common.success': 'यश',
    'common.back': 'परत',
    'common.next': 'पुढे',
    'common.remember': 'लक्षात ठेवा',
  },

  Urdu: {
    // Navigation & Common
    'nav.home': 'ہوم',
    'nav.messages': 'پیغامات',
    'nav.notifications': 'اطلاعات',
    'nav.profile': 'پروفائل',
    'nav.settings': 'سیٹنگز',
    'nav.about': 'ہمارے بارے میں',
    
    // Auth
    'auth.title': 'خوش آمدید',
    'auth.signIn': 'سائن ان کریں',
    'auth.signUp': 'سائن اپ کریں',
    'auth.email': 'ای میل',
    'auth.password': 'پاس ورڈ',
    'auth.phone': 'فون نمبر',
    'auth.name': 'مکمل نام',
    'auth.forgotPassword': 'پاس ورڈ بھول گئے?',
    'auth.dontHaveAccount': 'اکاؤنٹ نہیں ہے?',
    'auth.alreadyHaveAccount': 'پہلے سے اکاؤنٹ ہے?',
    'auth.createAccount': 'اکاؤنٹ بنائیں',
    'auth.signInSubtitle': 'جاری رکھنے کے لیے سائن ان کریں',
    'auth.signUpSubtitle': 'شروع کرنے کے لیے سائن اپ کریں',
    
    // Role Selection
    'role.selectRole': 'اپنا کردار منتخب کریں',
    'role.jobSeeker': 'نوکری تلاش کار',
    'role.salonOwner': 'سیلون مالک',
    'role.employer': 'استخدام کار',
    
    // Job Discovery
    'job.search': 'سیلون تلاش کریں...',
    'job.filter': 'فلٹر',
    'job.salary': 'تنخواہ',
    'job.experience': 'تجربہ',
    'job.location': 'مقام',
    'job.unlock': 'کھولیں',
    'job.message': 'پیغام',
    'job.apply': 'ابھی درخواست کریں',
    'job.saved': 'محفوظ',
    'job.unsave': 'محفوظ نہ کریں',
    'job.rating': 'تشخیص',
    'job.reviews': 'جائزے',
    'job.distance': 'فاصلہ',
    'job.accommodation': 'رہائش',
    'job.foodProvided': 'کھانا فراہم',
    
    // Resume
    'resume.title': 'اپنا ریزیومے بنائیں',
    'resume.name': 'مکمل نام',
    'resume.role': 'عہدہ',
    'resume.experience': 'تجربے کے سال',
    'resume.skills': 'مہارت',
    'resume.salary': 'متوقع تنخواہ',
    'resume.location': 'مقام',
    'resume.continue': 'جاری رکھیں',
    
    // Settings
    'settings.title': 'سیٹنگز',
    'settings.editProfile': 'پروفائل میں ترمیم کریں',
    'settings.notifications': 'اطلاعات',
    'settings.privacy': 'رازداری',
    'settings.help': 'مدد اور معاونت',
    'settings.language': 'زبان',
    'settings.darkMode': 'تاریک موڈ',
    'settings.logout': 'لاگ آؤٹ',
    'settings.jobAlerts': 'نوکری الرٹس',
    'settings.messages': 'پیغامات',
    'settings.promotions': 'پروموشنز',
    'settings.reminders': 'یادیں',
    
    // General
    'common.save': 'محفوظ کریں',
    'common.cancel': 'منسوخ کریں',
    'common.delete': 'حذف کریں',
    'common.edit': 'ترمیم کریں',
    'common.loading': 'لوڈ ہو رہا ہے...',
    'common.error': 'خرابی',
    'common.success': 'کامیاب',
    'common.back': 'پیچھے',
    'common.next': 'آگے',
    'common.remember': 'یاد رکھیں',
  },
}

const LANGUAGE_STORAGE_KEY = 'salonjobsindia_language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setLanguageState] = useState<Language>('English')

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (language: Language) => {
    setLanguageState(language)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }

  const t = (key: string): string => {
    return translations[currentLanguage][key] || translations['English'][key] || key
  }

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
