/**
 * JSON-LD Structured Data for SEO
 * Provides rich snippets for search engines
 */

export interface JobPostingSchema {
  '@context': 'https://schema.org';
  '@type': 'JobPosting';
  title: string;
  description: string;
  datePosted: string;
  dateModified?: string;
  hiringOrganization: {
    '@type': 'Organization';
    name: string;
    sameAs?: string;
  };
  jobLocation: {
    '@type': 'Place';
    address: {
      '@type': 'PostalAddress';
      addressCountry: string;
      addressRegion?: string;
      streetAddress?: string;
    };
  };
  baseSalary?: {
    '@type': 'PriceSpecification';
    currency: string;
    value: {
      '@type': 'QuantitativeValue';
      value: string | number;
    };
  };
  employmentType: string;
  validThrough?: string;
  url?: string;
}

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'WebApplication' | 'Organization';
  name: string;
  description: string;
  url: string;
  logo: string;
  sameAs?: string[];
  email?: string;
  telephone?: string;
  address?: {
    '@type': 'PostalAddress';
    addressCountry: string;
    addressLocality?: string;
  };
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

/**
 * Generate JSON-LD for Salon Jobs India organization
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Salon Jobs India',
    description: 'Find salon jobs and hire beauty professionals across India. Connect with hair stylists, beauticians, nail technicians, and more.',
    url: 'https://www.salonjobsindia.com',
    logo: 'https://www.salonjobsindia.com/icon-512.png',
    sameAs: [
      'https://www.facebook.com/salonjobsindia',
      'https://twitter.com/salonjobsindia',
      'https://www.instagram.com/salonjobsindia',
    ],
    email: 'support@salonjobsindia.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressLocality: 'India',
    },
  };
}

/**
 * Generate JSON-LD for a job posting
 */
export function generateJobPostingSchema(job: {
  title: string;
  description: string;
  salonName: string;
  location: string;
  salary?: string;
  postedDate: string;
  expiryDate?: string;
  employmentType?: string;
}): JobPostingSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.postedDate,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.salonName,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
        addressRegion: job.location,
      },
    },
    ...(job.salary && {
      baseSalary: {
        '@type': 'PriceSpecification',
        currency: 'INR',
        value: {
          '@type': 'QuantitativeValue',
          value: job.salary,
        },
      },
    }),
    employmentType: job.employmentType || 'FULL_TIME',
    ...(job.expiryDate && { validThrough: job.expiryDate }),
  };
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url?: string }>): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

/**
 * Generate FAQPage schema for FAQ section
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Format structured data as JSON-LD script tag
 */
export function formatAsJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}

/**
 * Generate open graph meta tags
 */
export function generateOpenGraphTags(data: {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
}) {
  return {
    'og:title': data.title,
    'og:description': data.description,
    'og:image': data.image || 'https://www.salonjobsindia.com/icon-512.png',
    'og:url': data.url,
    'og:type': data.type || 'website',
    'og:site_name': 'Salon Jobs India',
  };
}

/**
 * Generate Twitter meta tags
 */
export function generateTwitterTags(data: {
  title: string;
  description: string;
  image?: string;
  creator?: string;
}) {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': data.title,
    'twitter:description': data.description,
    'twitter:image': data.image || 'https://www.salonjobsindia.com/icon-512.png',
    'twitter:site': '@salonjobsindia',
    ...(data.creator && { 'twitter:creator': data.creator }),
  };
}
