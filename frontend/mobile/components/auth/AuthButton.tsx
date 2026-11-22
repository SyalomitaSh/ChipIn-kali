import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
} from 'react-native';
import { ReactNode } from 'react';

type AuthButtonProps = {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'social';
    icon?: ReactNode;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
};

export default function AuthButton({
    title,
    onPress,
    variant = 'primary',
    icon,
    loading = false,
    disabled = false,
    style,
}: AuthButtonProps) {
    const isPrimary = variant === 'primary';
    const isDisabled = disabled || loading;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.button,
                isPrimary ? styles.primaryButton : styles.socialButton,
                pressed && !isDisabled && styles.pressed,
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#333333'} />
            ) : (
                <View style={styles.content}>
                    {icon && <View style={styles.icon}>{icon}</View>}

                    <Text
                        style={[
                            styles.buttonText,
                            isPrimary ? styles.primaryText : styles.socialText,
                        ]}
                    >
                        {title}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        minHeight: 52,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: '#173B67',
    },
    socialButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: 10,
    },
    buttonText: {
        fontFamily: 'MontserratBold',
        fontSize: 15,
        fontWeight: 'normal',
    },
    primaryText: {
        color: '#FFFFFF',
    },
    socialText: {
        color: '#333333',
    },
    pressed: {
        opacity: 0.8,
    },
    disabled: {
        opacity: 0.5,
    },
});