import { useAuthModal } from "../context/AuthModalContext";
import { LoginForm } from "./LoginForm";
import { Modal } from "./Modal";
import { RegisterForm } from "./RegisterForm";

export function AuthModal() {
  const { isOpen, mode, isDismissable, close, setMode } = useAuthModal();

  return (
    <Modal isOpen={isOpen} onClose={close} dismissable={isDismissable}>
      {mode === "login" ? (
        <LoginForm onSuccess={close} onSwitchToRegister={() => setMode("register")} />
      ) : (
        <RegisterForm onSuccess={close} onSwitchToLogin={() => setMode("login")} />
      )}
    </Modal>
  );
}
