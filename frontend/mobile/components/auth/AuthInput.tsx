import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

type AuthInputProps = TextInputProps & {
    label: string;
    error?: string;
};

export default function AuthInput({
    label,
    error,
    secureTextEntry,
    style,
    ...props
}: AuthInputProps) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPassword = secureTextEntry === true;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    {...props}
                    style={[styles.input, style]}
                    secureTextEntry={isPassword && !isPasswordVisible}
                    placeholderTextColor="#A0A0A0"
                />

                {isPassword && (
                    <Pressable
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.visibilityButton}
                        hitSlop={10}
                    >
                        {isPasswordVisible ? (
                            <EyeOff size={20} color="#555555" />
                        ) : (
                            <Eye size={20} color="#555555" />
                        )}
                    </Pressable>
                )}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontFamily: 'MontserratMedium',
        fontSize: 14,
        fontWeight: 'normal',
        color: '#333333',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#CFCFCF',
    },
    input: {
        flex: 1,
        fontFamily: 'MontserratRegular',
        fontSize: 15,
        color: '#222222',
        paddingVertical: 12,
    },
    visibilityButton: {
        paddingLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        fontFamily: 'MontserratRegular',
        fontSize: 12,
        color: '#D93025',
        marginTop: 5,
    },
});