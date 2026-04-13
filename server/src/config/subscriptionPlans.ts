// Subscription plans configuration matching frontend plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'free' | 'basic' | 'premium' | 'enterprise';
  price: number;
  currency: string;
  duration: number; // days
  description: string;
  features: {
    maxJobPosts: number;
    maxApplicationsPerJob: number;
    featuredListings: number;
    prioritySupport: boolean;
    analyticsAccess: boolean;
    resumeBuilder: boolean;
    unlimitedApplications: boolean;
  };
  forRole: 'professional' | 'owner' | 'both';
  popular?: boolean;
}

export const professionalPlans: SubscriptionPlan[] = [
  {
    id: 'prof-free',
    name: 'Free',
    type: 'free',
    price: 0,
    currency: 'INR',
    duration: 30,
    description: 'Get started with basic features',
    features: {
      maxJobPosts: 0,
      maxApplicationsPerJob: 0,
      featuredListings: 0,
      prioritySupport: false,
      analyticsAccess: false,
      resumeBuilder: false,
      unlimitedApplications: false
    },
    forRole: 'professional'
  },
  {
    id: 'prof-basic',
    name: 'Basic',
    type: 'basic',
    price: 299,
    currency: 'INR',
    duration: 30,
    description: 'Perfect for professionals starting their career',
    features: {
      maxJobPosts: 0,
      maxApplicationsPerJob: 0,
      featuredListings: 0,
      prioritySupport: false,
      analyticsAccess: false,
      resumeBuilder: true,
      unlimitedApplications: false
    },
    forRole: 'professional'
  },
  {
    id: 'prof-premium',
    name: 'Premium',
    type: 'premium',
    price: 599,
    currency: 'INR',
    duration: 30,
    description: 'Maximize your job opportunities',
    features: {
      maxJobPosts: 0,
      maxApplicationsPerJob: 0,
      featuredListings: 0,
      prioritySupport: true,
      analyticsAccess: true,
      resumeBuilder: true,
      unlimitedApplications: true
    },
    forRole: 'professional',
    popular: true
  }
];

export const ownerPlans: SubscriptionPlan[] = [
  {
    id: 'owner-free',
    name: 'Free',
    type: 'free',
    price: 0,
    currency: 'INR',
    duration: 30,
    description: 'Try out basic hiring features',
    features: {
      maxJobPosts: 1,
      maxApplicationsPerJob: 5,
      featuredListings: 0,
      prioritySupport: false,
      analyticsAccess: false,
      resumeBuilder: false,
      unlimitedApplications: false
    },
    forRole: 'owner'
  },
  {
    id: 'owner-basic',
    name: 'Basic',
    type: 'basic',
    price: 499,
    currency: 'INR',
    duration: 30,
    description: 'For small salons with occasional hiring needs',
    features: {
      maxJobPosts: 3,
      maxApplicationsPerJob: 20,
      featuredListings: 0,
      prioritySupport: false,
      analyticsAccess: false,
      resumeBuilder: false,
      unlimitedApplications: false
    },
    forRole: 'owner'
  },
  {
    id: 'owner-premium',
    name: 'Premium',
    type: 'premium',
    price: 999,
    currency: 'INR',
    duration: 30,
    description: 'For growing salons with regular hiring',
    features: {
      maxJobPosts: 10,
      maxApplicationsPerJob: 50,
      featuredListings: 2,
      prioritySupport: true,
      analyticsAccess: true,
      resumeBuilder: false,
      unlimitedApplications: false
    },
    forRole: 'owner',
    popular: true
  },
  {
    id: 'owner-enterprise',
    name: 'Enterprise',
    type: 'enterprise',
    price: 2499,
    currency: 'INR',
    duration: 30,
    description: 'For salon chains and large operations',
    features: {
      maxJobPosts: 100,
      maxApplicationsPerJob: 200,
      featuredListings: 10,
      prioritySupport: true,
      analyticsAccess: true,
      resumeBuilder: false,
      unlimitedApplications: true
    },
    forRole: 'owner'
  }
];

export const getAllPlans = (): SubscriptionPlan[] => {
  return [...professionalPlans, ...ownerPlans];
};

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return getAllPlans().find(plan => plan.id === planId);
};

export const getPlansForRole = (role: 'professional' | 'owner'): SubscriptionPlan[] => {
  return getAllPlans().filter(plan => plan.forRole === role || plan.forRole === 'both');
};
