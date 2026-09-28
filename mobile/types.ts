export type UserRole = 'restaurant' | 'household' | 'organization' | 'volunteer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  address?: string;
  verified: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface FoodDonation {
  id: string;
  donor_id: string;
  donor_name: string;
  food_name: string;
  category: 'Cooked Meals' | 'Bakery & Sweets' | 'Raw Produce' | 'Packaged Goods';
  is_veg: boolean;
  quantity: string;
  prepared_time: string;
  expiry_time: string;
  image_url: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'accepted' | 'picked_up' | 'completed' | 'expired';
  accepted_by_org_id?: string;
  accepted_by_org_name?: string;
  assigned_volunteer_id?: string;
  assigned_volunteer_name?: string;
  notes?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'NGO' | 'Orphanage' | 'Shelter' | 'Volunteer Group';
  address: string;
  city: string;
  contact_phone: string;
  verified: boolean;
  active_requests: number;
  meals_rescued: number;
  latitude: number;
  longitude: number;
}

export interface VolunteerTask {
  id: string;
  donation_id: string;
  volunteer_id: string;
  org_id: string;
  status: 'assigned' | 'en_route' | 'picked_up' | 'delivered';
  pickup_address: string;
  delivery_address: string;
  updated_at: string;
}

export interface LiveImpact {
  meals_saved: number;
  food_rescued_kg: number;
  co2_prevented_kg: number;
  active_ngos: number;
  cities_covered: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'new_nearby' | 'accepted' | 'reminder' | 'completed' | 'verification';
  read: boolean;
  created_at: string;
}
