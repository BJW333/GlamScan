import { useState } from 'react';
import { useThrottledToast } from './useThrottledToast';

interface UseSocialShareProps {
  url: string;
  title: string;
  text: string;
}

export const useSocialShare = ({ url, title, text }: UseSocialShareProps) => {
  const [isCopying, setIsCopying] = useState(false);
  const throttledToast = useThrottledToast({ throttleMs: 1500 });
  
  const canShareNative = typeof navigator !== 'undefined' && 'share' in navigator;

  const shareNative = async () => {
    if (canShareNative) {
      try {
        await navigator.share({ url, title, text });
        throttledToast.success('Content shared successfully!', 'native-share');
      } catch (error: any) {
        // Don't show error for user cancellation
        if (error.name !== 'AbortError') {
          throttledToast.error('Failed to share content', 'native-share-error');
        }
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  const copyLink = async () => {
    if (isCopying) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(url);
      throttledToast.success(
        'Link copied!', 
        'copy-link',
        'You can now paste it anywhere to share',
        {
          label: 'Paste & Go',
          onClick: () => {
            // Try to focus the most recent input or textarea
            const inputs = document.querySelectorAll('input[type="text"], input[type="url"], textarea');
            const lastInput = inputs[inputs.length - 1] as HTMLElement;
            if (lastInput) {
              lastInput.focus();
            }
          }
        }
      );
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        throttledToast.success(
          'Link copied!', 
          'copy-link',
          'You can now paste it anywhere to share'
        );
      } catch (fallbackError) {
        throttledToast.error(
          'Failed to copy link', 
          'copy-link-error',
          'Please try selecting and copying the link manually'
        );
      }
      document.body.removeChild(textArea);
    } finally {
      setTimeout(() => setIsCopying(false), 1200);
    }
  };

  const shareToTwitter = () => {
    try {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420,scrollbars=yes,resizable=yes');
      throttledToast.info('Opening Twitter...', 'twitter-share');
    } catch (error) {
      throttledToast.error('Failed to open Twitter', 'twitter-share-error');
    }
  };

  const shareToFacebook = () => {
    try {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(facebookUrl, '_blank', 'width=550,height=420,scrollbars=yes,resizable=yes');
      throttledToast.info('Opening Facebook...', 'facebook-share');
    } catch (error) {
      throttledToast.error('Failed to open Facebook', 'facebook-share-error');
    }
  };

  const shareToWhatsApp = () => {
    try {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
      window.open(whatsappUrl, '_blank');
      throttledToast.info('Opening WhatsApp...', 'whatsapp-share');
    } catch (error) {
      throttledToast.error('Failed to open WhatsApp', 'whatsapp-share-error');
    }
  };

  const shareViaEmail = () => {
    try {
      const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
      window.location.href = emailUrl;
      throttledToast.info('Opening email client...', 'email-share');
    } catch (error) {
      throttledToast.error('Failed to open email client', 'email-share-error');
    }
  };

  return {
    shareNative,
    copyLink,
    shareToTwitter,
    shareToFacebook,
    shareToWhatsApp,
    shareViaEmail,
    canShareNative,
    isCopying,
  };
};