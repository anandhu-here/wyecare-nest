import {
  User as UserIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Calendar as CalendarIcon,
  CreditCard as CreditCardIcon,
  Camera as CameraIcon,
  X as XIcon,
  Pencil as PencilIcon,
  Users as UsersIcon,
} from 'lucide-react';
import ProfileTab from './profile';
import CareHomePreferences from './home-preference';
import AccountSettingsTab from './account-settings';
import AgencyPreferences from './agency-preference';
// import { Preferences } from './preferences';
// import AccountSettingsTab from './settings';
// import ComingSoon from 'src/components/core/ui/coming-soon';
// import CareHomePreferences from './home-preference';
// import StaffSettings from './staff-settings';

export const agency_items = [
  { icon: <UserIcon />, label: 'Profile', component: ProfileTab },
  { icon: <CalendarIcon />, label: 'Shift Settings', component: AgencyPreferences },
  {
    icon: <SettingsIcon />,
    label: 'Account Settings',
    component: AccountSettingsTab,
  },
  // { icon: <CreditCardIcon />, label: 'Subscription', component: ComingSoon },
  // {
  //   icon: <UsersIcon />,
  //   label: 'Staffs Settings',
  //   component: StaffSettings,
  // },
];


export const home_items = [
  { icon: <UserIcon />, label: 'Profile', component: ProfileTab },
  { icon: <CalendarIcon />, label: 'Shift Settings', component: CareHomePreferences },
  { icon: <SettingsIcon />, label: 'Overview', component: AccountSettingsTab },
  // { icon: <CreditCardIcon />, label: 'Subscription', component: ComingSoon }
];