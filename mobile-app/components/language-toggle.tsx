import i18n, { setLanguage } from '@/i18n';
import * as Updates from 'expo-updates';
import { I18nManager, Pressable, Text } from 'react-native';

export function LanguageToggle() {
    const isArabic = i18n.language === 'ar';

    async function onToggle() {
        const next = isArabic ? 'en' : 'ar';
        await setLanguage(next as 'en' | 'ar');
        const shouldRTL = next === 'ar';
        if (I18nManager.isRTL !== shouldRTL) {
            I18nManager.allowRTL(shouldRTL);
            I18nManager.forceRTL(shouldRTL);
            // Full app reload required for RTL flip
            try {
                await Updates.reloadAsync();
            } catch {
                // fallback on dev global reload
                // @ts-expect-error
                global?.expo?.reload?.();
            }
        }
    }

    return (
        <Pressable onPress={onToggle} style={{ padding: 8 }}>
            <Text>{isArabic ? 'English' : 'العربية'}</Text>
        </Pressable>
    );
}


