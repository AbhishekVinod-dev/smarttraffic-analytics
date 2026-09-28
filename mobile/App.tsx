import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, 
  Platform, SafeAreaView, StatusBar, Modal, Animated, Easing, Dimensions, 
  ActivityIndicator, Switch 
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FoodDonation, UserRole } from './types';

const { width, height } = Dimensions.get('window');

// High-resolution verified partner / chef avatar photo
const userAvatarUrl = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80';

// Initial Mock Mobile Donations centered around Thrissur, Kerala
const initialData: FoodDonation[] = [
  {
    id: 'mob-1',
    donor_id: 'rest-1',
    donor_name: 'Taj Banquet Kitchen Thrissur',
    food_name: 'Rich Paneer Butter Masala & Naan Trays',
    category: 'Cooked Meals',
    is_veg: true,
    quantity: '45 boxes',
    prepared_time: new Date(Date.now() - 3600000).toISOString(),
    expiry_time: new Date(Date.now() + 7200000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=60',
    pickup_address: 'Swaraj Round West, Thrissur, Kerala',
    latitude: 10.5300,
    longitude: 76.2100,
    status: 'available',
    notes: 'Freshly prepared for evening gala. Packed in food-grade insulated containers.',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'mob-2',
    donor_id: 'rest-2',
    donor_name: 'Ansar Bakery & Sweets East Fort',
    food_name: 'Assorted Croissants & Fruit Buns Batch',
    category: 'Bakery & Sweets',
    is_veg: true,
    quantity: '120 pcs',
    prepared_time: new Date(Date.now() - 7200000).toISOString(),
    expiry_time: new Date(Date.now() + 14400000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=60',
    pickup_address: 'East Fort Gate, Thrissur, Kerala',
    latitude: 10.5250,
    longitude: 76.2200,
    status: 'available',
    notes: 'Morning fresh bake surplus. Perfect for evening shelter tea distribution.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'mob-3',
    donor_id: 'rest-3',
    donor_name: 'Hotel Sapphire MG Road',
    food_name: 'Malabar Chicken Biryani & Raita Packs',
    category: 'Cooked Meals',
    is_veg: false,
    quantity: '60 servings',
    prepared_time: new Date(Date.now() - 5400000).toISOString(),
    expiry_time: new Date(Date.now() + 9000000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60',
    pickup_address: 'MG Road, Near Railway Station, Thrissur',
    latitude: 10.5210,
    longitude: 76.2130,
    status: 'accepted',
    accepted_by_org_name: 'Asha Community Shelter Thrissur',
    assigned_volunteer_name: 'Rajesh Kumar (Bike #KL-08-4421)',
    notes: 'Hot thermal packs. Dispatched courier is en route for pickup.',
    created_at: new Date(Date.now() - 5000000).toISOString(),
  }
];

const initialOrgs = [
  { id: 'org-1', name: 'Asha Community Shelter Thrissur', type: 'NGO', address: 'Poothole Road, Thrissur', verified: true, active_requests: 4, meals_rescued: 1420 },
  { id: 'org-2', name: 'St. Marys Orphanage & Care', type: 'Orphanage', address: 'Chettiyangadi, Thrissur', verified: true, active_requests: 2, meals_rescued: 890 },
  { id: 'org-3', name: 'Thrissur Food Rescue Group', type: 'Volunteer Group', address: 'Kokkalai, Thrissur', verified: false, active_requests: 6, meals_rescued: 2150 },
];

const initialImpact = {
  meals_saved: 1420,
  food_rescued_kg: 680,
  co2_prevented_kg: 1700,
  active_ngos: 14,
  cities_covered: 1,
};

// ============================================================================
// COMPONENT 1: LAUNCH VIDEO SPLASH (Playing User's mp4 without button)
// ============================================================================
const VideoSplash = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <View style={styles.splashContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0E4225" />
      <Video
        source={require('./assets/app-launch-screen.mp4')}
        style={StyleSheet.absoluteFillObject}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded && status.didJustFinish) {
            onFinish();
          }
        }}
      />
      {/* Optional skip option at top right just in case user wants to jump */}
      <SafeAreaView style={styles.skipContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={onFinish} activeOpacity={0.8}>
          <Text style={styles.skipText}>Skip ⏭</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

// ============================================================================
// COMPONENT 2: DEDICATED LOGIN / WELCOME PORTAL (Matching Website UI)
// ============================================================================
const AuthScreen = ({ onLogin }: { onLogin: (role: UserRole, name: string) => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('restaurant');
  const [email, setEmail] = useState('donor@tajhotel.com');
  const [password, setPassword] = useState('••••••••');
  const [name, setName] = useState('Taj Banquet Kitchen Thrissur');
  const [loading, setLoading] = useState(false);

  const roles = [
    { id: 'restaurant', label: 'Restaurant / Bakery', icon: 'restaurant', desc: 'List surplus trays in <30 seconds' },
    { id: 'organization', label: 'NGO / Shelter', icon: 'heart', desc: 'Receive radar alerts & claim batches' },
    { id: 'volunteer', label: 'Rescue Volunteer', icon: 'bicycle-outline', desc: 'Turn-by-turn GPS pickup courier' },
  ];

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      let userName = name;
      if (selectedRole === 'restaurant') userName = 'Taj Banquet Kitchen Thrissur';
      else if (selectedRole === 'organization') userName = 'Asha Community Shelter Thrissur';
      else userName = 'Rajesh Kumar (Volunteer #442)';
      onLogin(selectedRole, userName);
    }, 600);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(selectedRole, 'Google Verified Donor');
    }, 500);
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF5DD" />
      <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
        
        {/* Brand Header */}
        <View style={styles.authHeader}>
          <View style={styles.authLogoBox}>
            <Image source={require('./assets/nobglogo.png')} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
          </View>
          <Text style={styles.authTitle}>{isSignUp ? 'Create Mission Account' : 'Welcome Portal Hub'}</Text>
          <Text style={styles.authSubtitle}>Surplus Food Rescue & Radar Dispatch</Text>
        </View>

        {/* Role Selector Grid */}
        <View style={styles.authSection}>
          <Text style={styles.authLabel}>SELECT YOUR ACTIVE PORTAL ROLE</Text>
          <View style={styles.roleGrid}>
            {roles.map((r) => {
              const isSel = selectedRole === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedRole(r.id as UserRole)}
                  style={[styles.roleCard, isSel && styles.roleCardActive]}
                >
                  <View style={[styles.roleIconCircle, isSel && styles.roleIconCircleActive]}>
                    <Ionicons name={r.icon as any} size={22} color={isSel ? '#FFFFFF' : '#0E4225'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleTitle, isSel && styles.roleTitleActive]}>{r.label}</Text>
                    <Text style={[styles.roleDesc, isSel && styles.roleDescActive]}>{r.desc}</Text>
                  </View>
                  {isSel && <Ionicons name="checkmark-circle" size={22} color="#0E4225" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Form Box */}
        <View style={styles.authFormBox}>
          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Organization / User Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#0E4225" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Taj Banquet Kitchen"
                  placeholderTextColor="rgba(14,66,37,0.4)"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#0E4225" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="donor@tajhotel.com"
                placeholderTextColor="rgba(14,66,37,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#0E4225" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(14,66,37,0.4)"
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.9} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>{isSignUp ? 'Create Free Account Hub' : 'Launch Role Dashboard'}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or instant one-click demo</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.85}>
            <MaterialCommunityIcons name="google" size={18} color="#0E4225" />
            <Text style={styles.googleBtnText}>Continue with Google Verified Demo</Text>
          </TouchableOpacity>

          {/* Guest Mode Button */}
          <TouchableOpacity 
            style={styles.guestBtn} 
            onPress={() => onLogin(selectedRole, 'Guest Shelter Partner (Test Mode)')}
          >
            <Ionicons name="shield-checkmark" size={16} color="#1a663b" />
            <Text style={styles.guestBtnText}>Continue as Guest (Test Mode)</Text>
          </TouchableOpacity>

          {/* Toggle Sign Up */}
          <View style={styles.toggleAuthRow}>
            <Text style={styles.toggleAuthText}>
              {isSignUp ? 'Already registered on platform?' : "Don't have a donor account?"}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.toggleAuthLink}>{isSignUp ? 'Sign In Hub' : 'Sign Up Free'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// COMPONENT 3: MAIN APP DASHBOARD (Swiggy & Zomato Sample UI)
// ============================================================================
export default function App() {
  // 100% Guaranteed Icon Loading via useFonts
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>('restaurant');
  const [userName, setUserName] = useState('Taj Banquet Kitchen Thrissur');
  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'create' | 'notifications' | 'profile'>('feed');

  // App Data States
  const [donations, setDonations] = useState<FoodDonation[]>(initialData);
  const [orgs, setOrgs] = useState(initialOrgs);
  const [impact, setImpact] = useState(initialImpact);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Form States
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState<'Cooked Meals' | 'Bakery & Sweets' | 'Raw Produce'>('Cooked Meals');
  const [isVeg, setIsVeg] = useState(true);
  const [address, setAddress] = useState('Swaraj Round West, Thrissur, Kerala');
  const [notes, setNotes] = useState('Freshly packed hot boxes in thermal containers');

  // Modal / Detail States
  const [activeModal, setActiveModal] = useState<{ type: 'detail' | 'success' | 'qr' | 'ai'; data?: any } | null>(null);

  // Profile Settings States
  const [pushAlerts, setPushAlerts] = useState(true);
  const [sosMode, setSosMode] = useState(true);
  const [voiceNav, setVoiceNav] = useState(true);

  // Notifications State
  const [notifs, setNotifs] = useState([
    { id: '1', title: '📍 New Nearby Surplus Listed!', msg: 'Biryani Express East Fort listed 60x Chicken Biryani servings (1.8 km away in Thrissur). Rescue before 5 PM.', time: 'Just now', read: false },
    { id: '2', title: '⚡ <30s Match Verified', msg: 'Taj Banquet Kitchen batch confirmed safe under ISO 22000 thermal guidelines.', time: '12m ago', read: false },
    { id: '3', title: '✅ Volunteer Assigned', msg: 'Courier Rajesh (Bike KL-08-AU-8891) dispatched for MG Road bakery pickup.', time: '1h ago', read: true }
  ]);

  const handleLogin = (selRole: UserRole, selName: string) => {
    setRole(selRole);
    setUserName(selName);
    setIsAuthenticated(true);
  };

  const acceptItem = (id: string) => {
    setDonations(donations.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: 'accepted',
          accepted_by_org_name: 'Asha Community Shelter Thrissur',
          assigned_volunteer_name: 'Courier Rajesh (Bike KL-08-4421)'
        };
      }
      return d;
    }));
    setImpact(prev => ({
      ...prev,
      meals_saved: prev.meals_saved + 45,
      food_rescued_kg: prev.food_rescued_kg + 20,
      co2_prevented_kg: prev.co2_prevented_kg + 50
    }));
    setActiveModal({
      type: 'success',
      data: {
        title: 'Batch Claimed!',
        msg: 'Autonomous dispatch initialized! Volunteer Rajesh Kumar is en route to MG Road kitchen.',
        icon: 'checkmark-circle'
      }
    });
  };

  const submitDonation = () => {
    if (!foodName || !quantity) {
      setActiveModal({ type: 'success', data: { title: 'Missing Fields', msg: 'Please enter food item name and quantity count.', icon: 'alert-triangle' } });
      return;
    }

    const newDon: FoodDonation = {
      id: 'mob-' + Date.now(),
      donor_id: 'user-mob',
      donor_name: userName,
      food_name: foodName,
      category: category,
      is_veg: isVeg,
      quantity: quantity,
      prepared_time: new Date().toISOString(),
      expiry_time: new Date(Date.now() + 10800000).toISOString(),
      image_url: category === 'Bakery & Sweets' 
        ? 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=60'
        : 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=60',
      pickup_address: address,
      latitude: 10.5300,
      longitude: 76.2100,
      status: 'available',
      notes: notes,
      created_at: new Date().toISOString()
    };

    setDonations([newDon, ...donations]);
    setFoodName('');
    setQuantity('');
    setActiveTab('feed');
    setActiveModal({ 
      type: 'success', 
      data: { 
        title: 'Broadcast Live! ⚡', 
        msg: 'Your surplus listing was dispatched to 14 NGOs and 45 active couriers within a 5km radius in Thrissur in under 30 seconds!',
        icon: 'flash'
      } 
    });
  };

  const filteredDonations = donations.filter(item => {
    if (selectedFilter === 'veg' && !item.is_veg) return false;
    if (selectedFilter === 'cooked' && item.category !== 'Cooked Meals') return false;
    if (selectedFilter === 'bakery' && item.category !== 'Bakery & Sweets') return false;
    if (selectedFilter === 'urgent' && item.status !== 'available') return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return item.food_name.toLowerCase().includes(q) || item.donor_name.toLowerCase().includes(q) || item.pickup_address.toLowerCase().includes(q);
    }
    return true;
  });

  if (showSplash) {
    return <VideoSplash onFinish={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* SWIGGY & ZOMATO STYLE TOP HEADER */}
      <View style={styles.zomatoHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location" size={18} color="#0E4225" />
            <Text style={styles.zomatoLocationTitle} numberOfLines={1}>Swaraj Round West, Thrissur</Text>
            <Ionicons name="chevron-down" size={16} color="#0E4225" />
          </View>
          <Text style={styles.zomatoLocationSub}>⚡ Live Proximity Radar • 5km Coverage</Text>
        </View>
        <TouchableOpacity 
          style={styles.zomatoSosBtn}
          onPress={() => setActiveModal({ type: 'success', data: { title: 'SOS Relief Activated', msg: 'Emergency food rescue alert broadcasted to Thrissur Disaster Relief Hub.', icon: 'radio' } })}
        >
          <View style={styles.sosDot} />
          <Text style={styles.zomatoSosText}>SOS MODE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zomatoAvatar} onPress={() => setActiveTab('profile')}>
          <Image source={{ uri: userAvatarUrl }} style={styles.headerAvatarImg} />
          <View style={styles.zomatoOnlineBadge} />
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT AREA */}
      <View style={styles.mainContent}>
        
        {/* TAB 1: FEED (Swiggy / Zomato Food Cards + Hero Spotlight Banner) */}
        {activeTab === 'feed' && (
          <View style={{ flex: 1 }}>
            {/* Swiggy/Zomato Search & Voice Bar */}
            <View style={styles.zomatoSearchContainer}>
              <View style={styles.zomatoSearchBar}>
                <Ionicons name="search" size={18} color="#0E4225" />
                <TextInput
                  style={styles.zomatoSearchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search biryani, bakery trays, donor kitchens..."
                  placeholderTextColor="#6B7280"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                <View style={styles.zomatoSearchDivider} />
                <TouchableOpacity onPress={() => setActiveModal({ type: 'success', data: { title: 'Voice Search', msg: 'Listening for surplus food query...', icon: 'mic' } })}>
                  <Ionicons name="mic" size={18} color="#0E4225" />
                </TouchableOpacity>
              </View>
            </View>

            {/* SWIGGY & ZOMATO HERO SPOTLIGHT BANNER */}
            <View style={styles.heroBannerContainer}>
              <View style={styles.heroBannerCard}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop&q=80' }} 
                  style={styles.heroBannerImg} 
                />
                <View style={styles.heroBannerOverlay}>
                  <View style={styles.heroBannerTag}>
                    <Ionicons name="flame" size={14} color="#FFFFFF" />
                    <Text style={styles.heroBannerTagText}>LIVE IN THRISSUR • SWARAJ ROUND</Text>
                  </View>
                  <Text style={styles.heroBannerTitle}>Emergency Food Rescue Drive 🌿</Text>
                  <Text style={styles.heroBannerSub}>500+ hot biryani & artisan bakery boxes ready for instant courier dispatch.</Text>
                  <TouchableOpacity 
                    style={styles.heroBannerBtn}
                    onPress={() => setActiveModal({
                      type: 'success',
                      data: {
                        title: 'Thrissur Mega Drive Active!',
                        msg: 'All 14 shelter hubs in Thrissur are synchronized. Claim any batch below with 0 transport fee today!',
                        icon: 'ribbon'
                      }
                    })}
                  >
                    <Text style={styles.heroBannerBtnText}>Claim Emergency Batch Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#0E4225" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Horizontal Filter Pills */}
            <View style={{ height: 50 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zomatoFiltersScroll}>
                {[
                  { id: 'all', label: '⚡ <30s Speed Rescue', icon: 'flash', highlight: true },
                  { id: 'veg', label: '🌿 Pure Veg', icon: 'leaf' },
                  { id: 'cooked', label: '🍱 Cooked Meals', icon: 'restaurant' },
                  { id: 'bakery', label: '🥐 Bakery & Sweets', icon: 'cafe' },
                  { id: 'urgent', label: '🔥 Urgent (<2h left)', icon: 'time' },
                ].map(f => {
                  const isSel = selectedFilter === f.id;
                  return (
                    <TouchableOpacity 
                      key={f.id} 
                      onPress={() => setSelectedFilter(f.id)}
                      style={[styles.zomatoFilterPill, isSel ? styles.zomatoFilterActive : null]}
                    >
                      <Ionicons name={f.icon as any} size={14} color={isSel ? '#FFFFFF' : '#0E4225'} />
                      <Text style={[styles.zomatoFilterText, isSel ? { color: '#FFFFFF' } : null]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Food Cards List */}
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              {filteredDonations.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.zomatoCard} 
                  activeOpacity={0.92} 
                  onPress={() => setActiveModal({ type: 'detail', data: item })}
                >
                  {/* Image Banner with Overlays */}
                  <View style={styles.zomatoImgContainer}>
                    <Image source={{ uri: item.image_url }} style={styles.zomatoImg} />
                    <View style={styles.zomatoTopLeftBadge}>
                      <Text style={styles.zomatoTopLeftText}>⭐ 4.9 VERIFIED DONOR • FSSAI</Text>
                    </View>
                    <View style={styles.zomatoBottomLeftBadge}>
                      <Ionicons name="flash" size={12} color="#FFFFFF" />
                      <Text style={styles.zomatoBottomLeftText}>⚡ 24s RESCUE TIME</Text>
                    </View>
                    <View style={styles.zomatoTimeRightBadge}>
                      <Text style={styles.zomatoTimeRightText}>🕒 Rescue before 5 PM</Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={styles.zomatoContent}>
                    <View style={styles.zomatoTitleRow}>
                      <Text style={styles.zomatoFoodTitle} numberOfLines={1}>{item.food_name}</Text>
                      <View style={[styles.vegBox, { borderColor: item.is_veg ? '#16a34a' : '#dc2626' }]}>
                        <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#16a34a' : '#dc2626' }]} />
                      </View>
                    </View>

                    <Text style={styles.zomatoDonorText}>
                      <Ionicons name="restaurant-outline" size={14} color="#0E4225" /> {item.donor_name} • 1.2 km away
                    </Text>

                    <View style={styles.zomatoTagsRow}>
                      <View style={styles.zomatoTag}><Text style={styles.zomatoTagText}>📦 {item.quantity}</Text></View>
                      <View style={styles.zomatoTag}><Text style={styles.zomatoTagText}>🔥 65°C Hot Boxes</Text></View>
                      <View style={styles.zomatoTag}><Text style={styles.zomatoTagText}>✨ ISO 22000 Safe</Text></View>
                    </View>

                    <Text style={styles.zomatoAddressText} numberOfLines={1}>
                      <Ionicons name="location-outline" size={13} color="#6B7280" /> {item.pickup_address}
                    </Text>

                    {/* Prominent Swiggy/Zomato Claim Button */}
                    {item.status === 'available' ? (
                      <TouchableOpacity style={styles.zomatoClaimBtn} onPress={() => acceptItem(item.id)} activeOpacity={0.85}>
                        <Text style={styles.zomatoClaimBtnText}>CLAIM & RESCUE BATCH</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.zomatoClaimedBox}>
                        <Ionicons name="checkmark-circle" size={18} color="#0E4225" />
                        <Text style={styles.zomatoClaimedText}>RESERVED FOR COURIER PICKUP</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}

        {/* TAB 2: RADAR MAP (Thrissur, Kerala + OpenStreetMap Tile Fallback + Map Drawer) */}
        {activeTab === 'map' && (
          <View style={styles.mapContainer}>
            <View style={styles.mapHeaderBox}>
              <Text style={styles.mapCenterText}>Live Geo-Proximity Radar</Text>
              <Text style={styles.mapSubText}>Thrissur, Kerala • Tap markers to inspect & rescue batches</Text>
            </View>
            
            <View style={styles.mapCard}>
              <MapView
                style={styles.mapView}
                provider={undefined}
                mapType={Platform.OS === 'android' ? 'none' : 'standard'}
                initialRegion={{
                  latitude: 10.5276,
                  longitude: 76.2144,
                  latitudeDelta: 0.07,
                  longitudeDelta: 0.07,
                }}
              >
                {/* OpenStreetMap Tile Layer (Guarantees map tiles load without Google Cloud API billing) */}
                <UrlTile
                  urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maximumZ={19}
                  flipY={false}
                />

                {/* User Shelter Hub Marker */}
                <Marker
                  coordinate={{ latitude: 10.5276, longitude: 76.2144 }}
                  title="You (Thrissur Shelter Hub)"
                  description="Active Radar Receiver Hub"
                >
                  <View style={styles.userMarkerPin}>
                    <Ionicons name="home" size={16} color="#FFFFFF" />
                  </View>
                </Marker>

                {/* Donation Markers */}
                {donations.map((d) => (
                  <Marker
                    key={d.id}
                    coordinate={{ latitude: d.latitude, longitude: d.longitude }}
                    title={d.food_name}
                    description={`${d.donor_name} • ${d.quantity}`}
                    onCalloutPress={() => setActiveModal({ type: 'detail', data: d })}
                  >
                    <View style={[styles.donorMarkerPin, d.status === 'accepted' && styles.donorMarkerClaimed]}>
                      <MaterialCommunityIcons 
                        name={d.category === 'Bakery & Sweets' ? 'food-croissant' : 'food'} 
                        size={16} 
                        color={d.status === 'accepted' ? '#666666' : '#FFFFFF'} 
                      />
                    </View>
                  </Marker>
                ))}

                {/* Route Line */}
                {donations.length > 0 && (
                  <Polyline
                    coordinates={[
                      { latitude: 10.5276, longitude: 76.2144 },
                      { latitude: donations[0].latitude, longitude: donations[0].longitude },
                    ]}
                    strokeColor="#0E4225"
                    strokeWidth={3}
                    lineDashPattern={[6, 4]}
                  />
                )}
              </MapView>

              {/* Floating Rescan Button */}
              <TouchableOpacity 
                style={styles.mapScanBtn} 
                onPress={() => setActiveModal({
                  type: 'success',
                  data: { title: 'Radar Scanned', msg: 'Area rescanned. 3 verified donor kitchens detected around Thrissur Swaraj Round & East Fort.', icon: 'radar' }
                })}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.mapScanText}>Rescan Thrissur (5km)</Text>
              </TouchableOpacity>

              {/* Swiggy Genie Style Horizontal Drawer at Bottom of Map */}
              <View style={styles.mapDrawer}>
                <Text style={styles.mapDrawerTitle}>Active Batches Nearby (Thrissur)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}>
                  {donations.map(d => (
                    <TouchableOpacity key={d.id} style={styles.mapDrawerCard} onPress={() => setActiveModal({ type: 'detail', data: d })}>
                      <Text style={styles.mapDrawerFood} numberOfLines={1}>{d.food_name}</Text>
                      <Text style={styles.mapDrawerDonor}>{d.donor_name} • {d.quantity}</Text>
                      <View style={styles.mapDrawerRow}>
                        <Text style={styles.mapDrawerDist}>📍 1.2 km</Text>
                        <View style={styles.mapDrawerBtn}>
                          <Text style={styles.mapDrawerBtnText}>Claim</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: CREATE DONATION (<30s) */}
        {activeTab === 'create' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.createHeaderRow}>
              <View>
                <Text style={styles.screenTitle}>Under 30s Listing</Text>
                <Text style={styles.subLabel}>List surplus food instantly</Text>
              </View>
              <TouchableOpacity 
                style={styles.dictateBtn}
                onPress={() => {
                  setFoodName('Artisan Bakery Sourdough Loaves');
                  setQuantity('45 Servings (~20 kg)');
                  setActiveModal({
                    type: 'success',
                    data: { title: 'Voice Captured!', msg: 'Transcribed: "45 servings of artisan bakery sourdough loaves at MG Road Thrissur."', icon: 'mic-outline' }
                  });
                }}
              >
                <Ionicons name="mic-outline" size={16} color="#0E4225" />
                <Text style={styles.dictateText}>Dictate</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formCard}>
              {/* AI Vision Estimation Box */}
              <TouchableOpacity 
                style={styles.aiBox}
                onPress={() => setActiveModal({ type: 'ai', data: {} })}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="camera-outline" size={18} color="#0E4225" />
                    <Text style={styles.aiBoxTitle}>AI Vision Estimate & Freshness</Text>
                  </View>
                  <Text style={styles.aiBoxSub}>Auto-calculate servings & verify thermal safety</Text>
                </View>
                <View style={styles.runScanBadge}>
                  <Ionicons name="flash" size={12} color="#FFFFFF" />
                  <Text style={styles.runScanText}>Run Scan</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Food Item Name</Text>
              <TextInput
                style={styles.input}
                value={foodName}
                onChangeText={setFoodName}
                placeholder="e.g. 50x Paneer & Rice boxes"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Quantity Count</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g. 40 servings or 25 kg"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.toggleRow}>
                {(['Cooked Meals', 'Bakery & Sweets'] as const).map(c => {
                  const isActive = category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.toggleBtn, isActive && styles.toggleActiveGreen]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Dietary Type</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, isVeg && styles.toggleActiveGreen]} 
                  onPress={() => setIsVeg(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="leaf" size={16} color={isVeg ? '#FFFFFF' : '#0E4225'} />
                    <Text style={[styles.toggleText, isVeg && styles.toggleTextActive]}>Pure Veg</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, !isVeg && styles.toggleActiveRed]} 
                  onPress={() => setIsVeg(false)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="restaurant" size={16} color={!isVeg ? '#FFFFFF' : '#dc2626'} />
                    <Text style={[styles.toggleText, !isVeg && styles.toggleTextActive]}>Non-Veg</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Pickup Kitchen Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Kitchen GPS address"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Food Safety & Prep Notes</Text>
              <TextInput
                style={styles.input}
                value={notes}
                onChangeText={setNotes}
                placeholder="Cooked at 2 PM. Maintained at 65°C."
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity style={styles.submitBtn} onPress={submitDonation}>
                <Text style={styles.submitBtnText}>Broadcast To Radar Feed</Text>
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.feedHeader}>
              <Text style={styles.screenTitle}>Dispatch Alerts</Text>
              <TouchableOpacity onPress={() => setNotifs(notifs.map(n => ({ ...n, read: true })))}>
                <View style={styles.markReadBtn}>
                  <Ionicons name="checkmark-done" size={16} color="#0E4225" />
                  <Text style={styles.markReadText}>Mark All Read</Text>
                </View>
              </TouchableOpacity>
            </View>

            {notifs.map(n => (
              <TouchableOpacity 
                key={n.id} 
                style={[styles.notifCard, !n.read && styles.notifUnread]}
                onPress={() => {
                  setNotifs(notifs.map(x => x.id === n.id ? { ...x, read: true } : x));
                  setActiveModal({
                    type: 'success',
                    data: { title: n.title, msg: n.msg, icon: 'notifications' }
                  });
                }}
              >
                <View style={styles.notifRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={n.read ? 'mail-open-outline' : 'notifications'} size={18} color="#0E4225" />
                    <Text style={styles.notifTitle}>{n.title}</Text>
                  </View>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
                <Text style={styles.notifMsg}>{n.msg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* TAB 5: PROFILE & IMPACT */}
        {activeTab === 'profile' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.profileHero}>
              <View style={styles.avatarCircle}>
                <Image source={{ uri: userAvatarUrl }} style={styles.profileAvatarImg} />
                <View style={styles.avatarVerified}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileRole}>Verified {role.toUpperCase()} Partner • FSSAI Lic #1002004300</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>⭐ Level 4 Food Hero • Top 5% Rescuer</Text>
              </View>
            </View>

            {/* Impact Grid */}
            <Text style={styles.sectionHeading}>Real-Time ESG Carbon Impact</Text>
            <View style={styles.impactGrid}>
              <View style={styles.impactBox}>
                <Text style={styles.impactVal}>{impact.meals_saved}</Text>
                <Text style={styles.impactLab}>Meals Rescued</Text>
              </View>
              <View style={styles.impactBox}>
                <Text style={styles.impactVal}>{impact.co2_prevented_kg} kg</Text>
                <Text style={styles.impactLab}>CO₂ Prevented</Text>
              </View>
              <View style={styles.impactBox}>
                <Text style={styles.impactVal}>${(impact.meals_saved * 5).toLocaleString()}</Text>
                <Text style={styles.impactLab}>Value Saved</Text>
              </View>
              <View style={styles.impactBox}>
                <Text style={styles.impactVal}>42 Days</Text>
                <Text style={styles.impactLab}>Active Streak</Text>
              </View>
            </View>

            {/* Earned Badges */}
            <Text style={styles.sectionHeading}>Earned Platform Badges</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
              <View style={styles.badgeCard}>
                <View style={styles.badgeIconCircle}><Ionicons name="shield-checkmark" size={22} color="#0E4225" /></View>
                <Text style={styles.badgeName}>Verified KYC</Text>
              </View>
              <View style={styles.badgeCard}>
                <View style={styles.badgeIconCircle}><Ionicons name="flash" size={22} color="#d97706" /></View>
                <Text style={styles.badgeName}>&lt;30s Speed</Text>
              </View>
              <View style={styles.badgeCard}>
                <View style={styles.badgeIconCircle}><Ionicons name="leaf" size={22} color="#16a34a" /></View>
                <Text style={styles.badgeName}>Zero Landfill</Text>
              </View>
            </ScrollView>

            {/* Settings Toggles */}
            <Text style={styles.sectionHeading}>Portal Settings</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="notifications-outline" size={20} color="#0E4225" />
                  <Text style={styles.settingLabel}>Radar Push Alerts (&lt;5km)</Text>
                </View>
                <Switch value={pushAlerts} onValueChange={setPushAlerts} trackColor={{ false: '#d1d5db', true: '#0E4225' }} />
              </View>
              <View style={styles.settingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="radio-outline" size={20} color="#0E4225" />
                  <Text style={styles.settingLabel}>SOS Relief Broadcast Mode</Text>
                </View>
                <Switch value={sosMode} onValueChange={setSosMode} trackColor={{ false: '#d1d5db', true: '#0E4225' }} />
              </View>
              <View style={styles.settingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="navigate-outline" size={20} color="#0E4225" />
                  <Text style={styles.settingLabel}>Turn-by-Turn GPS Voice</Text>
                </View>
                <Switch value={voiceNav} onValueChange={setVoiceNav} trackColor={{ false: '#d1d5db', true: '#0E4225' }} />
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={() => {
                setIsAuthenticated(false);
                setShowSplash(true);
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#dc2626" />
              <Text style={styles.logoutText}>Sign Out of Mission Portal</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

      </View>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('feed')}>
          <Ionicons name="restaurant" size={22} color={activeTab === 'feed' ? '#0E4225' : '#6B7280'} />
          <Text style={[styles.navText, activeTab === 'feed' && styles.navTextActive]}>Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('map')}>
          <Ionicons name="map" size={22} color={activeTab === 'map' ? '#0E4225' : '#6B7280'} />
          <Text style={[styles.navText, activeTab === 'map' && styles.navTextActive]}>Radar</Text>
        </TouchableOpacity>

        {/* CENTER FLOATING ACTION BUTTON */}
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fabButton} onPress={() => setActiveTab('create')} activeOpacity={0.9}>
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('notifications')}>
          <Ionicons name="notifications" size={22} color={activeTab === 'notifications' ? '#0E4225' : '#6B7280'} />
          <Text style={[styles.navText, activeTab === 'notifications' && styles.navTextActive]}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Ionicons name="person" size={22} color={activeTab === 'profile' ? '#0E4225' : '#6B7280'} />
          <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* CUSTOM MODAL SYSTEM */}
      <Modal visible={!!activeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            
            {/* DETAIL MODAL */}
            {activeModal?.type === 'detail' && activeModal.data && (
              <View>
                <Image source={{ uri: activeModal.data.image_url }} style={styles.modalImg} />
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>{activeModal.data.food_name}</Text>
                  <Text style={styles.modalDonor}>{activeModal.data.donor_name}</Text>
                  
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoItem}>
                      <Text style={styles.modalInfoLab}>Quantity</Text>
                      <Text style={styles.modalInfoVal}>{activeModal.data.quantity}</Text>
                    </View>
                    <View style={styles.modalInfoItem}>
                      <Text style={styles.modalInfoLab}>Dietary</Text>
                      <Text style={styles.modalInfoVal}>{activeModal.data.is_veg ? '🌿 Pure Veg' : '🍗 Non-Veg'}</Text>
                    </View>
                    <View style={styles.modalInfoItem}>
                      <Text style={styles.modalInfoLab}>Route Saving</Text>
                      <Text style={styles.modalInfoVal}>~1.2 kg CO₂</Text>
                    </View>
                  </View>

                  <Text style={styles.modalDesc}>
                    {activeModal.data.notes || 'Fresh surplus food maintained under ISO 22000 thermal guidelines. Packed in food-grade containers.'}
                  </Text>
                  
                  <Text style={styles.modalAddr}>📍 {activeModal.data.pickup_address}</Text>

                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity style={styles.modalActionBtn} onPress={() => {
                      const id = activeModal.data.id;
                      setActiveModal(null);
                      acceptItem(id);
                    }}>
                      <Text style={styles.modalActionText}>Claim Batch Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalQrBtn} onPress={() => setActiveModal({ type: 'qr', data: activeModal.data })}>
                      <Ionicons name="qr-code" size={20} color="#0E4225" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* SUCCESS / ALERT MODAL */}
            {activeModal?.type === 'success' && activeModal.data && (
              <View style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <Ionicons name={activeModal.data.icon || 'checkmark-circle'} size={40} color="#0E4225" />
                </View>
                <Text style={styles.successTitle}>{activeModal.data.title}</Text>
                <Text style={styles.successMsg}>{activeModal.data.msg}</Text>
                <TouchableOpacity style={styles.successBtn} onPress={() => setActiveModal(null)}>
                  <Text style={styles.successBtnText}>Continue Mission</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* QR CODE MODAL */}
            {activeModal?.type === 'qr' && activeModal.data && (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>Tamper-Proof Handover QR</Text>
                <Text style={styles.successMsg}>Scan this code upon arrival at kitchen to verify volunteer identity and unlock insulated containers.</Text>
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code" size={140} color="#0E4225" />
                  <Text style={styles.qrCodeText}>#MU-AUTH-9842</Text>
                </View>
                <TouchableOpacity style={styles.successBtn} onPress={() => setActiveModal(null)}>
                  <Text style={styles.successBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* AI VISION MODAL */}
            {activeModal?.type === 'ai' && (
              <View style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="camera" size={38} color="#0E4225" />
                </View>
                <Text style={styles.successTitle}>AI Freshness & Count Scan</Text>
                <Text style={styles.successMsg}>Simulating LiDAR volumetric tray scanning and thermal IR temperature reading...</Text>
                <View style={styles.aiResultBox}>
                  <Text style={styles.aiResultText}>✅ Estimated Servings: 48 - 52 boxes</Text>
                  <Text style={styles.aiResultText}>✅ Surface Temp: 64.8°C (Safe Hot Zone)</Text>
                  <Text style={styles.aiResultText}>✅ Spoilage Risk: 0.02% (Excellent)</Text>
                </View>
                <TouchableOpacity style={styles.successBtn} onPress={() => {
                  setFoodName('AI Verified Hot Biryani Boxes');
                  setQuantity('50 Servings (~22 kg)');
                  setActiveModal(null);
                }}>
                  <Text style={styles.successBtnText}>Apply AI Estimate To Form</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setActiveModal(null)}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ============================================================================
// STYLESHEET (Swiggy & Zomato Signature Styling)
// ============================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  splashContainer: { flex: 1, backgroundColor: '#0E4225', justifyContent: 'center', alignItems: 'center' },
  skipContainer: { position: 'absolute', top: 40, right: 20, zIndex: 100 },
  skipButton: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  skipText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', includeFontPadding: false, textAlignVertical: 'center' },

  // Auth Portal Styles
  authContainer: { flex: 1, backgroundColor: '#FBF5DD' },
  authScroll: { padding: 24, paddingBottom: 60 },
  authHeader: { alignItems: 'center', marginVertical: 20 },
  authLogoBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#0E4225', shadowOpacity: 0.15, shadowRadius: 10, marginBottom: 12 },
  authTitle: { fontSize: 26, fontWeight: '900', color: '#0E4225', textAlign: 'center', includeFontPadding: false },
  authSubtitle: { fontSize: 14, fontWeight: '600', color: '#4B5563', textAlign: 'center', marginTop: 4 },
  authSection: { marginVertical: 16 },
  authLabel: { fontSize: 12, fontWeight: '800', color: '#0E4225', letterSpacing: 1, marginBottom: 10 },
  roleGrid: { gap: 12 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E5E7EB', elevation: 2 },
  roleCardActive: { borderColor: '#0E4225', backgroundColor: '#F0FDF4' },
  roleIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  roleIconCircleActive: { backgroundColor: '#0E4225' },
  roleTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', includeFontPadding: false },
  roleTitleActive: { color: '#0E4225' },
  roleDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  roleDescActive: { color: '#166534', fontWeight: '500' },
  authFormBox: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#F9FAFB' },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1F2937', fontWeight: '500' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0E4225', paddingVertical: 16, borderRadius: 16, elevation: 4 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#0E4225', paddingVertical: 14, borderRadius: 16 },
  googleBtnText: { color: '#0E4225', fontSize: 14, fontWeight: '800', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  guestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8F5E9', paddingVertical: 14, borderRadius: 16 },
  guestBtnText: { color: '#166534', fontSize: 14, fontWeight: '800', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  toggleAuthRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
  toggleAuthText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  toggleAuthLink: { fontSize: 13, fontWeight: '800', color: '#0E4225', textDecorationLine: 'underline', includeFontPadding: false },

  // Swiggy & Zomato Header & Avatars
  zomatoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  zomatoLocationTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937', includeFontPadding: false },
  zomatoLocationSub: { fontSize: 11, fontWeight: '700', color: '#0E4225', marginTop: 2 },
  zomatoSosBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  sosDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' },
  zomatoSosText: { fontSize: 11, fontWeight: '800', color: '#DC2626', includeFontPadding: false, textAlignVertical: 'center' },
  zomatoAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  headerAvatarImg: { width: 38, height: 38, borderRadius: 19, resizeMode: 'cover' },
  profileAvatarImg: { width: 80, height: 80, borderRadius: 40, resizeMode: 'cover' },
  zomatoOnlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A', borderWidth: 2, borderColor: '#FFFFFF' },

  // Swiggy & Zomato Search & Filters
  mainContent: { flex: 1 },
  zomatoSearchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  zomatoSearchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  zomatoSearchInput: { flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '600', padding: 0 },
  zomatoSearchDivider: { width: 1, height: 20, backgroundColor: '#D1D5DB' },
  zomatoFiltersScroll: { paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  zomatoFilterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB', elevation: 1 },
  zomatoFilterActive: { backgroundColor: '#0E4225', borderColor: '#0E4225' },
  zomatoFilterText: { fontSize: 13, fontWeight: '700', color: '#374151', includeFontPadding: false, textAlignVertical: 'center' },

  // Swiggy & Zomato Hero Spotlight Banner
  heroBannerContainer: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  heroBannerCard: { borderRadius: 22, overflow: 'hidden', height: 170, backgroundColor: '#0E4225', elevation: 6, shadowColor: '#0E4225', shadowOpacity: 0.2, shadowRadius: 10 },
  heroBannerImg: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute' },
  heroBannerOverlay: { flex: 1, backgroundColor: 'rgba(14,66,37,0.85)', padding: 16, justifyContent: 'space-between' },
  heroBannerTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DC2626', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  heroBannerTagText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', includeFontPadding: false, textAlignVertical: 'center' },
  heroBannerTitle: { fontSize: 18, fontWeight: '900', color: '#FBF5DD', includeFontPadding: false },
  heroBannerSub: { fontSize: 12, color: '#E5E7EB', fontWeight: '500', lineHeight: 16 },
  heroBannerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FBF5DD', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, alignSelf: 'flex-start', gap: 8 },
  heroBannerBtnText: { color: '#0E4225', fontSize: 13, fontWeight: '800', includeFontPadding: false, textAlignVertical: 'center' },

  // Swiggy & Zomato Food Cards
  scroll: { padding: 16 },
  zomatoCard: { backgroundColor: '#FFFFFF', borderRadius: 22, overflow: 'hidden', marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  zomatoImgContainer: { height: 180, width: '100%', position: 'relative' },
  zomatoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  zomatoTopLeftBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  zomatoTopLeftText: { fontSize: 10, fontWeight: '800', color: '#0E4225', includeFontPadding: false, textAlignVertical: 'center' },
  zomatoBottomLeftBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0E4225', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  zomatoBottomLeftText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', includeFontPadding: false, textAlignVertical: 'center' },
  zomatoTimeRightBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  zomatoTimeRightText: { fontSize: 11, fontWeight: '700', color: '#FBF5DD', includeFontPadding: false, textAlignVertical: 'center' },
  zomatoContent: { padding: 16, gap: 8 },
  zomatoTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zomatoFoodTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: '#1F2937', includeFontPadding: false },
  vegBox: { width: 18, height: 18, borderWidth: 1.5, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  zomatoDonorText: { fontSize: 13, fontWeight: '700', color: '#4B5563', includeFontPadding: false },
  zomatoTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 2 },
  zomatoTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  zomatoTagText: { fontSize: 11, fontWeight: '700', color: '#4B5563', includeFontPadding: false, textAlignVertical: 'center' },
  zomatoAddressText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  zomatoClaimBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0E4225', paddingVertical: 14, borderRadius: 14, marginTop: 6, elevation: 2 },
  zomatoClaimBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  zomatoClaimedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8F5E9', paddingVertical: 12, borderRadius: 14, marginTop: 6 },
  zomatoClaimedText: { color: '#166534', fontSize: 13, fontWeight: '800', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },

  // Radar Map Styles
  mapContainer: { flex: 1, position: 'relative' },
  mapHeaderBox: { position: 'absolute', top: 12, left: 16, right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.95)', padding: 14, borderRadius: 16, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  mapCenterText: { fontSize: 16, fontWeight: '900', color: '#0E4225', textAlign: 'center', includeFontPadding: false },
  mapSubText: { fontSize: 12, fontWeight: '600', color: '#4B5563', textAlign: 'center', marginTop: 2 },
  mapCard: { flex: 1 },
  mapView: { flex: 1 },
  userMarkerPin: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0E4225', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF', elevation: 4 },
  donorMarkerPin: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FBF5DD', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#0E4225', elevation: 4 },
  donorMarkerClaimed: { backgroundColor: '#E5E7EB', borderColor: '#9CA3AF' },
  mapScanBtn: { position: 'absolute', top: 90, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0E4225', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, elevation: 6 },
  mapScanText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', includeFontPadding: false, textAlignVertical: 'center' },
  mapDrawer: { position: 'absolute', bottom: 16, left: 0, right: 0, zIndex: 10 },
  mapDrawerTitle: { fontSize: 13, fontWeight: '800', color: '#1F2937', marginLeft: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.9)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  mapDrawerCard: { width: 220, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 18, elevation: 6, borderWidth: 1, borderColor: '#E5E7EB', gap: 6 },
  mapDrawerFood: { fontSize: 14, fontWeight: '800', color: '#1F2937', includeFontPadding: false },
  mapDrawerDonor: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  mapDrawerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  mapDrawerDist: { fontSize: 12, fontWeight: '700', color: '#0E4225' },
  mapDrawerBtn: { backgroundColor: '#0E4225', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  mapDrawerBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', includeFontPadding: false, textAlignVertical: 'center' },

  // Create Form Styles
  createHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  screenTitle: { fontSize: 24, fontWeight: '900', color: '#1F2937', includeFontPadding: false },
  subLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  dictateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  dictateText: { color: '#0E4225', fontSize: 13, fontWeight: '800', includeFontPadding: false, textAlignVertical: 'center' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20, elevation: 4, gap: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  aiBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#86EFAC', gap: 12 },
  aiBoxTitle: { fontSize: 14, fontWeight: '800', color: '#0E4225', includeFontPadding: false },
  aiBoxSub: { fontSize: 12, color: '#166534', marginTop: 2 },
  runScanBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0E4225', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  runScanText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', includeFontPadding: false, textAlignVertical: 'center' },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1F2937', backgroundColor: '#F9FAFB', fontWeight: '500' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  toggleActiveGreen: { backgroundColor: '#0E4225', borderColor: '#0E4225' },
  toggleActiveRed: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#374151', includeFontPadding: false, textAlignVertical: 'center', textAlign: 'center' },
  toggleTextActive: { color: '#FFFFFF', includeFontPadding: false, textAlignVertical: 'center', textAlign: 'center' },

  // Notifications & Profile Styles
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  markReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  markReadText: { fontSize: 12, fontWeight: '800', color: '#0E4225', includeFontPadding: false, textAlignVertical: 'center' },
  notifCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6', gap: 6 },
  notifUnread: { borderLeftWidth: 4, borderLeftColor: '#0E4225', backgroundColor: '#F0FDF4' },
  notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937', includeFontPadding: false },
  notifTime: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  notifMsg: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  profileHero: { alignItems: 'center', backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, elevation: 4, marginBottom: 20 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarVerified: { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  profileName: { fontSize: 20, fontWeight: '900', color: '#1F2937', includeFontPadding: false },
  profileRole: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginTop: 4 },
  levelBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, marginTop: 12 },
  levelText: { fontSize: 12, fontWeight: '800', color: '#92400E', includeFontPadding: false, textAlignVertical: 'center' },
  sectionHeading: { fontSize: 16, fontWeight: '900', color: '#1F2937', marginBottom: 12, marginTop: 4, includeFontPadding: false },
  impactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  impactBox: { width: (width - 44) / 2, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, elevation: 2, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  impactVal: { fontSize: 22, fontWeight: '900', color: '#0E4225', includeFontPadding: false },
  impactLab: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 4 },
  badgeScroll: { gap: 12, paddingBottom: 10, marginBottom: 16 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  badgeIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  badgeName: { fontSize: 14, fontWeight: '800', color: '#1F2937', includeFontPadding: false, textAlignVertical: 'center' },
  settingsCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, elevation: 2, gap: 16, marginBottom: 20 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937', includeFontPadding: false, textAlignVertical: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', paddingVertical: 16, borderRadius: 16 },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '800', includeFontPadding: false, textAlignVertical: 'center', textAlign: 'center' },

  // Bottom Navigation & FAB
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#FFFFFF', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 16 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1 },
  navText: { fontSize: 11, fontWeight: '600', color: '#6B7280', includeFontPadding: false, textAlignVertical: 'center', textAlign: 'center' },
  navTextActive: { color: '#0E4225', fontWeight: '800' },
  fabContainer: { width: 64, alignItems: 'center' },
  fabButton: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#0E4225', justifyContent: 'center', alignItems: 'center', top: -20, elevation: 8, shadowColor: '#0E4225', shadowOpacity: 0.4, shadowRadius: 10, borderWidth: 4, borderColor: '#FFFFFF' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 28, overflow: 'hidden', elevation: 24, maxHeight: height * 0.85 },
  modalImg: { width: '100%', height: 200, resizeMode: 'cover' },
  modalBody: { padding: 22, gap: 12 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1F2937', includeFontPadding: false },
  modalDonor: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F3F4F6', padding: 14, borderRadius: 16, marginVertical: 4 },
  modalInfoItem: { alignItems: 'center' },
  modalInfoLab: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  modalInfoVal: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginTop: 2, includeFontPadding: false },
  modalDesc: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  modalAddr: { fontSize: 13, fontWeight: '700', color: '#0E4225' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalActionBtn: { flex: 1, backgroundColor: '#0E4225', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalActionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', includeFontPadding: false, textAlignVertical: 'center', textAlign: 'center' },
  modalQrBtn: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#86EFAC' },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  successBox: { padding: 28, alignItems: 'center', gap: 14, textAlign: 'center' },
  successIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#1F2937', textAlign: 'center', includeFontPadding: false },
  successMsg: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20 },
  successBtn: { backgroundColor: '#0E4225', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center', marginTop: 10 },
  successBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', includeFontPadding: false, textAlignVertical: 'center', textAlign: 'center' },
  qrPlaceholder: { alignItems: 'center', padding: 20, backgroundColor: '#FBF5DD', borderRadius: 20, borderWidth: 2, borderColor: '#0E4225', my: 10 },
  qrCodeText: { fontSize: 16, fontWeight: '900', color: '#0E4225', marginTop: 8, letterSpacing: 2, includeFontPadding: false },
  aiResultBox: { width: '100%', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#86EFAC', gap: 8 },
  aiResultText: { fontSize: 14, fontWeight: '700', color: '#166534', includeFontPadding: false },
});
