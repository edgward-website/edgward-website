// Internationalisation - dictionnaire des chaines d'interface partagees (Nav, Footer, formulaires).
// Le contenu editorial de chaque page reste dans la page elle-meme (FR a la racine, EN sous /en/).
// Aucune modification de la config de routing Astro : les 92 pages FR ne bougent pas.

export type Lang = 'fr' | 'en';
export const defaultLang: Lang = 'fr';

/** Deduit la langue depuis l'URL : /en/... => 'en', sinon 'fr'. */
export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/')[1];
  return seg === 'en' ? 'en' : 'fr';
}

interface NavLink {
  /** Chemin canonique FR ; localise a l'affichage via localize(). */
  href: string;
  label: string;
}

interface Strings {
  htmlLang: string;
  ogLocale: string;
  skipLink: string;
  nav: {
    links: NavLink[];
    cta: string;
    ctaHref: string;
    openMenu: string;
    closeMenu: string;
    switchTo: string; // libelle du bouton de bascule (langue cible)
    switchAria: string;
  };
  footer: {
    tagline: string;
    operatedBy: string;
    colProduct: string;
    colPro: string;
    colLegal: string;
    links: {
      individuals: string;
      alerts: string;
      coverage: string;
      partners: string;
      faq: string;
      blog: string;
      businesses: string;
      municipalities: string;
      alarmCentres: string;
      joinNetwork: string;
      terms: string;
      privacy: string;
      press: string;
      contact: string;
    };
    rights: string;
    madeBy: string;
  };
  contact: {
    name: string;
    namePlaceholder: string;
    email: string;
    phone: string;
    subject: string;
    subjectPlaceholder: string;
    subjects: string[];
    message: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    privacyBefore: string;
    privacyLink: string;
    privacyAfter: string;
    successTitle: string;
    successBody: string;
  };
  finalCta: {
    storeSub1: string; // "Télécharger sur" / "Download on the"
    storeSub2: string; // "Disponible sur" / "Get it on"
    guide: boolean; // FR = variante guide PDF ; EN = variante newsletter
    emailTitle: string;
    emailBody: string;
    emailPlaceholder: string;
    emailAria: string;
    emailButton: string;
    sending: string;
    privacyBefore: string;
    privacyLink: string;
    privacyAfter: string;
    successTitle: string;
    successBody: string;
    downloadLabel: string; // FR uniquement
  };
  investor: {
    name: string;
    namePlaceholder: string;
    email: string;
    org: string;
    optional: string;
    orgPlaceholder: string;
    profile: string;
    profilePlaceholder: string;
    profiles: string[];
    message: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    privacyBefore: string;
    privacyLink: string;
    privacyAfter: string;
    successTitle: string;
    successBody: string;
  };
}

export const ui: Record<Lang, Strings> = {
  fr: {
    htmlLang: 'fr',
    ogLocale: 'fr_CH',
    skipLink: 'Aller au contenu',
    nav: {
      links: [
        { href: '/particuliers', label: 'Particuliers' },
        { href: '/entreprises', label: 'Entreprises' },
        { href: '/communes', label: 'Communes' },
        { href: '/alertes', label: 'Alertes' },
        { href: '/edgward-en-suisse', label: 'Notre couverture' },
        { href: '/qui-sommes-nous', label: 'Qui sommes-nous' },
        { href: '/faq', label: 'FAQ' },
        { href: '/blog', label: 'Blog' },
      ],
      cta: "Télécharger l'app",
      ctaHref: '/#telecharger',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      switchTo: 'EN',
      switchAria: 'Switch to English',
    },
    footer: {
      tagline: 'Sécurité à la demande en Suisse romande.',
      operatedBy: 'Opéré par DBA Solutions sàrl, Rue des Bains 35, 1205 Genève.',
      colProduct: 'Produit',
      colPro: 'Professionnels',
      colLegal: 'Légal',
      links: {
        individuals: 'Particuliers',
        alerts: 'Alertes & infos',
        coverage: 'Edgward en Suisse',
        partners: 'Partenaires sécurité',
        faq: 'FAQ',
        blog: 'Blog',
        businesses: 'Entreprises',
        municipalities: 'Communes',
        alarmCentres: "Centrales d'alarme",
        joinNetwork: 'Rejoindre le réseau',
        terms: 'Conditions générales',
        privacy: 'Politique de confidentialité',
        press: 'Espace presse',
        contact: 'Contact',
      },
      rights: 'Tous droits réservés.',
      madeBy: 'Réalisé par',
    },
    contact: {
      name: 'Nom complet',
      namePlaceholder: 'Jean Dupont',
      email: 'Email',
      phone: 'Téléphone',
      subject: 'Sujet',
      subjectPlaceholder: 'Choisissez un sujet',
      subjects: ['Particulier', 'Entreprise', 'Commune', "Centrale d'alarme", 'Autre'],
      message: 'Message',
      messagePlaceholder: 'Décrivez votre besoin...',
      submit: 'Envoyer le message',
      sending: 'Envoi…',
      privacyBefore: 'En envoyant ce message, vous acceptez notre ',
      privacyLink: 'politique de confidentialité',
      privacyAfter: '.',
      successTitle: 'Message envoyé !',
      successBody: 'Merci, votre demande a bien été transmise. Notre équipe vous répond dans les meilleurs délais.',
    },
    finalCta: {
      storeSub1: 'Télécharger sur',
      storeSub2: 'Disponible sur',
      guide: true,
      emailTitle: 'Pas encore prêt ?',
      emailBody: 'Téléchargez gratuitement notre guide « Sécuriser son domicile ».',
      emailPlaceholder: 'votre@email.ch',
      emailAria: 'Votre adresse email',
      emailButton: 'Recevoir',
      sending: 'Envoi…',
      privacyBefore: 'En vous inscrivant, vous acceptez notre ',
      privacyLink: 'politique de confidentialité',
      privacyAfter: '.',
      successTitle: 'Merci !',
      successBody: 'Votre guide « Sécuriser son domicile » est prêt à télécharger.',
      downloadLabel: 'Télécharger le guide',
    },
    investor: {
      name: 'Nom complet',
      namePlaceholder: 'Jean Dupont',
      email: 'Email',
      org: 'Organisation',
      optional: '(optionnel)',
      orgPlaceholder: 'Société, fonds, institution',
      profile: 'Vous êtes',
      profilePlaceholder: 'Choisissez votre profil',
      profiles: ['Investisseur', 'Partenaire stratégique', 'Société de sécurité', 'Autre'],
      message: 'Message',
      messagePlaceholder: 'Votre intérêt, votre horizon, votre proposition...',
      submit: 'Échanger avec le fondateur',
      sending: 'Envoi…',
      privacyBefore: 'En envoyant ce message, vous acceptez notre ',
      privacyLink: 'politique de confidentialité',
      privacyAfter: '.',
      successTitle: 'Message envoyé !',
      successBody: 'Merci pour votre intérêt. Daniel vous répondra personnellement dans les meilleurs délais.',
    },
  },
  en: {
    htmlLang: 'en',
    ogLocale: 'en_GB',
    skipLink: 'Skip to content',
    nav: {
      links: [
        { href: '/particuliers', label: 'Individuals' },
        { href: '/entreprises', label: 'Businesses' },
        { href: '/comment-ca-marche', label: 'How it works' },
        { href: '/qui-sommes-nous', label: 'About' },
        { href: '/faq', label: 'FAQ' },
      ],
      cta: 'Get the app',
      ctaHref: '/en/#download',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      switchTo: 'FR',
      switchAria: 'Passer en français',
    },
    footer: {
      tagline: 'On-demand security across French-speaking Switzerland.',
      operatedBy: 'Operated by DBA Solutions Sàrl, Rue des Bains 35, 1205 Geneva.',
      colProduct: 'Product',
      colPro: 'For professionals',
      colLegal: 'Legal',
      links: {
        individuals: 'Individuals',
        alerts: 'Alerts & updates',
        coverage: 'Edgward across Switzerland',
        partners: 'Security partners',
        faq: 'FAQ',
        blog: 'Blog',
        businesses: 'Businesses',
        municipalities: 'Municipalities',
        alarmCentres: 'Alarm receiving centres',
        joinNetwork: 'Join the network',
        terms: 'Terms & conditions',
        privacy: 'Privacy policy',
        press: 'Press room',
        contact: 'Contact',
      },
      rights: 'All rights reserved.',
      madeBy: 'Built by',
    },
    contact: {
      name: 'Full name',
      namePlaceholder: 'John Smith',
      email: 'Email',
      phone: 'Phone',
      subject: 'Subject',
      subjectPlaceholder: 'Choose a subject',
      subjects: ['Individual', 'Business', 'Municipality', 'Alarm receiving centre', 'Other'],
      message: 'Message',
      messagePlaceholder: 'Tell us what you need...',
      submit: 'Send message',
      sending: 'Sending…',
      privacyBefore: 'By sending this message, you agree to our ',
      privacyLink: 'privacy policy',
      privacyAfter: '.',
      successTitle: 'Message sent!',
      successBody: 'Thank you, your request has been received. Our team will get back to you shortly.',
    },
    finalCta: {
      storeSub1: 'Download on the',
      storeSub2: 'Get it on',
      guide: false,
      emailTitle: 'Not ready yet?',
      emailBody: 'Get our home-security tips and Edgward updates by email.',
      emailPlaceholder: 'you@email.ch',
      emailAria: 'Your email address',
      emailButton: 'Subscribe',
      sending: 'Sending…',
      privacyBefore: 'By subscribing, you agree to our ',
      privacyLink: 'privacy policy',
      privacyAfter: '.',
      successTitle: 'Thank you!',
      successBody: "You're subscribed. We'll be in touch with useful security tips.",
      downloadLabel: '',
    },
    investor: {
      name: 'Full name',
      namePlaceholder: 'John Smith',
      email: 'Email',
      org: 'Organisation',
      optional: '(optional)',
      orgPlaceholder: 'Company, fund, institution',
      profile: 'You are',
      profilePlaceholder: 'Choose your profile',
      profiles: ['Investor', 'Strategic partner', 'Security firm', 'Other'],
      message: 'Message',
      messagePlaceholder: 'Your interest, your timeframe, your proposal...',
      submit: 'Talk to the founder',
      sending: 'Sending…',
      privacyBefore: 'By sending this message, you agree to our ',
      privacyLink: 'privacy policy',
      privacyAfter: '.',
      successTitle: 'Message sent!',
      successBody: 'Thank you for your interest. Daniel will reply to you personally as soon as possible.',
    },
  },
};
