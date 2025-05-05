import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showSnack } from '@wyecare/frontend/redux/reducers/snack/snack-slice';

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    // Clear user token or session
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className='w-[95vw] md:w-[30rem] bg-background'
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <LogOut className="h-5 w-5 mr-2 text-primary" />
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to log out of your account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-primary hover:bg-primary/90"
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutModal;
