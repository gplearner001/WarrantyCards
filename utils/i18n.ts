import { I18n } from 'i18n-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

// Define available languages
export const LANGUAGES = {
  en: 'English',
  hi: 'हिंदी',
  ro: 'Română',
  fr: 'Français',
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Define translations
const translations = {
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    remove: 'Remove',
    quantity: 'Quantity',
    
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    welcomeBack: 'Welcome Back',
    signInToAccount: 'Sign in to your account',
    dontHaveAccount: "Don't have an account?",
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    signUpToGetStarted: 'Sign up to get started',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign In',
    
    // Navigation
    home: 'Home',
    warranties: 'Warranties',
    groceries: 'Groceries',
    profile: 'Profile',
    scan: 'Scan',
    
    // Home
    hello: 'Hello',
    totalWarranties: 'Total Warranties',
    expiringSoon: 'Expiring Soon',
    recentlyAdded: 'Recently Added',
    seeAll: 'See All',
    noWarrantiesExpiringSoon: 'No warranties expiring soon',
    noRecentlyAddedWarranties: 'No recently added warranties',
    addedAgo: 'Added {{time}} ago',
    expiresIn: 'Expires in {{time}}',
    
    // Warranty Details
    warrantyDetails: 'Warranty Details',
    productName: 'Product Name',
    company: 'Company/Brand',
    expiryDate: 'Expiry Date',
    additionalInfo: 'Additional Information',
    receiptImage: 'Receipt Image',
    productImage: 'Product Image',
    deleteWarranty: 'Delete Warranty',
    deleteWarrantyConfirm: 'Are you sure you want to delete this warranty?',
    addToGroceryList: 'Add to Grocery List',
    
    // Scan
    addWarranty: 'Add Warranty',
    camera: 'Camera',
    gallery: 'Gallery',
    scanBarcode: 'Scan Barcode',
    scanReceipt: 'Scan Receipt',
    captureProduct: 'Capture Product',
    processingImage: 'Processing image...',
    extractingInfo: 'Extracting warranty information using OCR',
    notificationDays: 'Notification days before expiry',
    notificationDaysHelper: 'Enter how many days before expiry you want to be notified. For perishable items like groceries, you might want to set this to 1-2 days. For longer-term warranties, consider 7-30 days for advance notice.',
    
    // Profile
    settings: 'Settings',
    language: 'Language',
    notifications: 'Notifications',
    premiumSubscription: 'Premium Subscription',
    active: 'Active',
    inactive: 'Inactive',
    upgrade: 'Upgrade',
    rateAndFeedback: 'Rate & Feedback',
    helpAndSupport: 'Help & Support',
    privacyPolicy: 'Privacy Policy',
    appSettings: 'App Settings',
    version: 'Version',
    subscription: 'Subscription',
    support: 'Support',

    // Groceries
    groceryList: 'Grocery List',
    noItemsInGroceryList: 'No items in your grocery list',
    addItemsFromWarranties: 'Add items from your warranties to create your shopping list',
    removeFromGroceryList: 'Remove from Grocery List',
    removeFromGroceryListConfirm: 'Are you sure you want to remove this item from your grocery list?',
    failedToRemoveFromGroceryList: 'Failed to remove item from grocery list',
  },
  hi: {
    // Common
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    done: 'हो गया',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    remove: 'हटाएं',
    quantity: 'मात्रा',
    
    // Auth
    login: 'लॉग इन',
    register: 'रजिस्टर',
    logout: 'लॉग आउट',
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    welcomeBack: 'वापसी पर स्वागत है',
    signInToAccount: 'अपने खाते में साइन इन करें',
    dontHaveAccount: "खाता नहीं है?",
    signUp: 'साइन अप करें',
    createAccount: 'खाता बनाएं',
    signUpToGetStarted: 'शुरू करने के लिए साइन अप करें',
    alreadyHaveAccount: 'पहले से खाता है?',
    signIn: 'साइन इन करें',
    
    // Navigation
    home: 'होम',
    warranties: 'वारंटी',
    groceries: 'किराना',
    profile: 'प्रोफ़ाइल',
    scan: 'स्कैन',
    
    // Home
    hello: 'नमस्ते',
    totalWarranties: 'कुल वारंटी',
    expiringSoon: 'जल्द समाप्त होने वाली',
    recentlyAdded: 'हाल ही में जोड़ी गई',
    seeAll: 'सभी देखें',
    noWarrantiesExpiringSoon: 'कोई वारंटी जल्द समाप्त नहीं हो रही',
    noRecentlyAddedWarranties: 'कोई हाल की वारंटी नहीं',
    addedAgo: '{{time}} पहले जोड़ा गया',
    expiresIn: '{{time}} में समाप्त होगी',
    
    // Warranty Details
    warrantyDetails: 'वारंटी विवरण',
    productName: 'उत्पाद का नाम',
    company: 'कंपनी/ब्रांड',
    expiryDate: 'समाप्ति तिथि',
    additionalInfo: 'अतिरिक्त जानकारी',
    receiptImage: 'रसीद की छवि',
    productImage: 'उत्पाद की छवि',
    deleteWarranty: 'वारंटी हटाएं',
    deleteWarrantyConfirm: 'क्या आप वाकई इस वारंटी को हटाना चाहते हैं?',
    addToGroceryList: 'किराना सूची में जोड़ें',
    
    // Scan
    addWarranty: 'वारंटी जोड़ें',
    camera: 'कैमरा',
    gallery: 'गैलरी',
    scanBarcode: 'बारकोड स्कैन करें',
    scanReceipt: 'रसीद स्कैन करें',
    captureProduct: 'उत्पाद कैप्चर करें',
    processingImage: 'छवि प्रोसेस हो रही है...',
    extractingInfo: 'OCR का उपयोग करके वारंटी जानकारी निकाली जा रही है',
    notificationDays: 'समाप्ति से पहले सूचना दिन',
    notificationDaysHelper: 'दर्ज करें कि आप समाप्ति से कितने दिन पहले सूचित होना चाहते हैं। नाशवान वस्तुओं जैसे किराने का सामान के लिए, आप इसे 1-2 दिन पर सेट कर सकते हैं। लंबी अवधि की वारंटी के लिए, अग्रिम सूचना के लिए 7-30 दिन पर विचार करें।',
    
    // Profile
    settings: 'सेटिंग्स',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    premiumSubscription: 'प्रीमियम सदस्यता',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    upgrade: 'अपग्रेड करें',
    rateAndFeedback: 'रेट और फीडबैक',
    helpAndSupport: 'सहायता और समर्थन',
    privacyPolicy: 'गोपनीयता नीति',
    appSettings: 'ऐप सेटिंग्स',
    version: 'संस्करण',
    subscription: 'सदस्यता',
    support: 'सहायता',

    // Groceries
    groceryList: 'किराना सूची',
    noItemsInGroceryList: 'आपकी किराना सूची में कोई आइटम नहीं है',
    addItemsFromWarranties: 'अपनी खरीदारी सूची बनाने के लिए अपनी वारंटी से आइटम जोड़ें',
    removeFromGroceryList: 'किराना सूची से हटाएं',
    removeFromGroceryListConfirm: 'क्या आप वाकई इस आइटम को अपनी किराना सूची से हटाना चाहते हैं?',
    failedToRemoveFromGroceryList: 'किराना सूची से आइटम हटाने में विफल',
  },
  ro: {
    // Common
    save: 'Salvează',
    cancel: 'Anulează',
    delete: 'Șterge',
    edit: 'Editează',
    done: 'Gata',
    loading: 'Se încarcă...',
    error: 'Eroare',
    success: 'Succes',
    remove: 'Elimină',
    quantity: 'Cantitate',
    
    // Auth
    login: 'Autentificare',
    register: 'Înregistrare',
    logout: 'Deconectare',
    email: 'Email',
    password: 'Parolă',
    confirmPassword: 'Confirmă parola',
    forgotPassword: 'Ai uitat parola?',
    welcomeBack: 'Bine ai revenit',
    signInToAccount: 'Conectează-te la contul tău',
    dontHaveAccount: "Nu ai cont?",
    signUp: 'Înregistrează-te',
    createAccount: 'Creează cont',
    signUpToGetStarted: 'Înregistrează-te pentru a începe',
    alreadyHaveAccount: 'Ai deja cont?',
    signIn: 'Conectează-te',
    
    // Navigation
    home: 'Acasă',
    warranties: 'Garanții',
    groceries: 'Cumpărături',
    profile: 'Profil',
    scan: 'Scanează',
    
    // Home
    hello: 'Salut',
    totalWarranties: 'Total garanții',
    expiringSoon: 'Expiră curând',
    recentlyAdded: 'Adăugate recent',
    seeAll: 'Vezi toate',
    noWarrantiesExpiringSoon: 'Nu există garanții care expiră curând',
    noRecentlyAddedWarranties: 'Nu există garanții adăugate recent',
    addedAgo: 'Adăugat acum {{time}}',
    expiresIn: 'Expiră în {{time}}',
    
    // Warranty Details
    warrantyDetails: 'Detalii garanție',
    productName: 'Nume produs',
    company: 'Companie/Brand',
    expiryDate: 'Data expirării',
    additionalInfo: 'Informații adiționale',
    receiptImage: 'Imagine bon',
    productImage: 'Imagine produs',
    deleteWarranty: 'Șterge garanția',
    deleteWarrantyConfirm: 'Ești sigur că vrei să ștergi această garanție?',
    addToGroceryList: 'Adaugă la lista de cumpărături',
    
    // Scan
    addWarranty: 'Adaugă garanție',
    camera: 'Cameră',
    gallery: 'Galerie',
    scanBarcode: 'Scanează cod de bare',
    scanReceipt: 'Scanează bon',
    captureProduct: 'Fotografiază produs',
    processingImage: 'Se procesează imaginea...',
    extractingInfo: 'Se extrag informațiile din garanție folosind OCR',
    notificationDays: 'Zile de notificare înainte de expirare',
    notificationDaysHelper: 'Introdu cu câte zile înainte de expirare dorești să fii notificat. Pentru produse perisabile precum alimentele, poți seta 1-2 zile. Pentru garanții pe termen lung, consideră 7-30 zile pentru notificare în avans.',
    
    // Profile
    settings: 'Setări',
    language: 'Limbă',
    notifications: 'Notificări',
    premiumSubscription: 'Abonament Premium',
    active: 'Activ',
    inactive: 'Inactiv',
    upgrade: 'Actualizează',
    rateAndFeedback: 'Evaluează și feedback',
    helpAndSupport: 'Ajutor și suport',
    privacyPolicy: 'Politica de confidențialitate',
    appSettings: 'Setări aplicație',
    version: 'Versiune',
    subscription: 'Abonament',
    support: 'Suport',

    // Groceries
    groceryList: 'Listă cumpărături',
    noItemsInGroceryList: 'Nu există articole în lista de cumpărături',
    addItemsFromWarranties: 'Adaugă articole din garanții pentru a crea lista de cumpărături',
    removeFromGroceryList: 'Elimină din lista de cumpărături',
    removeFromGroceryListConfirm: 'Ești sigur că vrei să elimini acest articol din lista de cumpărături?',
    failedToRemoveFromGroceryList: 'Nu s-a putut elimina articolul din lista de cumpărături',
  },
  fr: {
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    done: 'Terminé',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    remove: 'Retirer',
    quantity: 'Quantité',
    
    // Auth
    login: 'Connexion',
    register: 'Inscription',
    logout: 'Déconnexion',
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    welcomeBack: 'Bon retour',
    signInToAccount: 'Connectez-vous à votre compte',
    dontHaveAccount: "Vous n'avez pas de compte ?",
    signUp: "S'inscrire",
    createAccount: 'Créer un compte',
    signUpToGetStarted: 'Inscrivez-vous pour commencer',
    alreadyHaveAccount: 'Vous avez déjà un compte ?',
    signIn: 'Se connecter',
    
    // Navigation
    home: 'Accueil',
    warranties: 'Garanties',
    groceries: 'Courses',
    profile: 'Profil',
    scan: 'Scanner',
    
    // Home
    hello: 'Bonjour',
    totalWarranties: 'Total des garanties',
    expiringSoon: 'Expire bientôt',
    recentlyAdded: 'Ajoutées récemment',
    seeAll: 'Voir tout',
    noWarrantiesExpiringSoon: "Aucune garantie n'expire bientôt",
    noRecentlyAddedWarranties: 'Aucune garantie ajoutée récemment',
    addedAgo: 'Ajouté il y a {{time}}',
    expiresIn: 'Expire dans {{time}}',
    
    // Warranty Details
    warrantyDetails: 'Détails de la garantie',
    productName: 'Nom du produit',
    company: 'Société/Marque',
    expiryDate: "Date d'expiration",
    additionalInfo: 'Informations supplémentaires',
    receiptImage: 'Image du reçu',
    productImage: 'Image du produit',
    deleteWarranty: 'Supprimer la garantie',
    deleteWarrantyConfirm: 'Êtes-vous sûr de vouloir supprimer cette garantie ?',
    addToGroceryList: 'Ajouter à la liste de courses',
    
    // Scan
    addWarranty: 'Ajouter une garantie',
    camera: 'Appareil photo',
    gallery: 'Galerie',
    scanBarcode: 'Scanner le code-barres',
    scanReceipt: 'Scanner le reçu',
    captureProduct: 'Photographier le produit',
    processingImage: "Traitement de l'image...",
    extractingInfo: 'Extraction des informations de garantie avec OCR',
    notificationDays: "Jours de notification avant l'expiration",
    notificationDaysHelper: "Entrez le nombre de jours avant l'expiration où vous souhaitez être notifié. Pour les produits périssables comme les courses, vous pouvez définir 1-2 jours. Pour les garanties à long terme, considérez 7-30 jours pour une notification anticipée.",
    
    // Profile
    settings: 'Paramètres',
    language: 'Langue',
    notifications: 'Notifications',
    premiumSubscription: 'Abonnement Premium',
    active: 'Actif',
    inactive: 'Inactif',
    upgrade: 'Mettre à niveau',
    rateAndFeedback: 'Évaluer et commentaires',
    helpAndSupport: 'Aide et support',
    privacyPolicy: 'Politique de confidentialité',
    appSettings: "Paramètres de l'application",
    version: 'Version',
    subscription: 'Abonnement',
    support: 'Support',

    // Groceries
    groceryList: 'Liste de courses',
    noItemsInGroceryList: 'Aucun article dans votre liste de courses',
    addItemsFromWarranties: 'Ajoutez des articles depuis vos garanties pour créer votre liste de courses',
    removeFromGroceryList: 'Retirer de la liste de courses',
    removeFromGroceryListConfirm: 'Êtes-vous sûr de vouloir retirer cet article de votre liste de courses ?',
    failedToRemoveFromGroceryList: "Échec du retrait de l'article de la liste de courses",
  },
};

// Create i18n instance
const i18n = new I18n(translations);

// Set default locale
i18n.defaultLocale = 'en';
i18n.locale = 'en';

// Storage implementation
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
};

// Create language store
interface LanguageState {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: async (code: LanguageCode) => {
    await storage.setItem('language', code);
    i18n.locale = code;
    set({ language: code });
  },
  initialize: async () => {
    const savedLanguage = await storage.getItem('language');
    if (savedLanguage && Object.keys(LANGUAGES).includes(savedLanguage)) {
      i18n.locale = savedLanguage as LanguageCode;
      set({ language: savedLanguage as LanguageCode });
    }
  },
}));

// Translation helper function
export function t(key: string, params?: Record<string, string>) {
  return i18n.t(key, params);
}

export default i18n;