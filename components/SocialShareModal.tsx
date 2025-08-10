import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./Dialog";
import { Button } from "./Button";
import { useSocialShare } from "../helpers/useSocialShare";
import { Link, Twitter, Facebook, MessageCircle, Mail, QrCode, Check } from "lucide-react";
import styles from "./SocialShareModal.module.css";

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
  text: string;
}

export const SocialShareModal = ({
  isOpen,
  onClose,
  shareUrl,
  title,
  text,
}: SocialShareModalProps) => {
  const [justCopied, setJustCopied] = useState(false);
  const {
    shareNative,
    copyLink,
    shareToTwitter,
    shareToFacebook,
    shareToWhatsApp,
    shareViaEmail,
    canShareNative,
    isCopying,
  } = useSocialShare({ url: shareUrl, title, text });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`;

  const handleCopyLink = async () => {
    await copyLink();
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Share this style</DialogTitle>
          <DialogDescription>
            Spread the inspiration! Share this look with your friends.
          </DialogDescription>
        </DialogHeader>
        <div className={styles.shareContainer}>
          {canShareNative && (
            <Button size="lg" onClick={shareNative} className={styles.nativeShareButton}>
              Share with your apps
            </Button>
          )}
          <div className={styles.shareGrid}>
            <button onClick={shareToTwitter} className={styles.shareOption}>
              <Twitter size={24} />
              <span>Twitter</span>
            </button>
            <button onClick={shareToFacebook} className={styles.shareOption}>
              <Facebook size={24} />
              <span>Facebook</span>
            </button>
            <button onClick={shareToWhatsApp} className={styles.shareOption}>
              <MessageCircle size={24} />
              <span>WhatsApp</span>
            </button>
            <button onClick={shareViaEmail} className={styles.shareOption}>
              <Mail size={24} />
              <span>Email</span>
            </button>
          </div>
          <div className={styles.copyLinkContainer}>
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              className={styles.linkInput}
              onClick={(e) => e.currentTarget.select()}
            />
            <Button 
              variant="secondary" 
              onClick={handleCopyLink} 
              disabled={isCopying}
              className={justCopied ? styles.copiedButton : ''}
            >
              {justCopied ? <Check size={16} /> : <Link size={16} />}
              {isCopying ? 'Copying...' : justCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className={styles.qrCodeContainer}>
            <div className={styles.qrCodeWrapper}>
              <img src={qrCodeUrl} alt="QR Code for sharing" />
            </div>
            <div className={styles.qrCodeText}>
              <QrCode size={32} />
              <h4>Scan QR Code</h4>
              <p>Open this on your phone by scanning the code.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};