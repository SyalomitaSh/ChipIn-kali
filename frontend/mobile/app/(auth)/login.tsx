
import { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Pressable,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';

import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';

export default function LoginScreen() {
    const router = useRouter();

    const { signIn } = useAuth();

    const [isLoading, setIsLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [errors, setErrors] = useState({
        email: '',
        password: '',
    });

    const validateForm = () => {
        const newErrors = {
            email: '',
            password: '',
        };

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);

        return !newErrors.email && !newErrors.password;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);

            await signIn(email.trim().toLowerCase(), password);

            Alert.alert(
                'Login Successful',
                'Welcome back to Chip-In!',
            );

            router.replace('/(tabs)');
        } catch (error) {
            if (error instanceof ApiError) {
                switch (error.code) {
                    case 'INVALID_CREDENTIALS':
                        Alert.alert(
                            'Login Failed',
                            'Email or password is incorrect.',
                        );
                        break;

                    case 'EMAIL_NOT_CONFIRMED':
                        Alert.alert(
                            'Email Not Confirmed',
                            'Please verify your email before logging in.',
                        );
                        break;

                    case 'RATE_LIMITED':
                        Alert.alert(
                            'Too Many Attempts',
                            'Please try again later.',
                        );
                        break;

                    default:
                        Alert.alert('Login Failed', error.message);
                        break;
                }
            } else {
                Alert.alert(
                    'Connection Error',
                    'Unable to connect to the server. Please try again.',
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        Alert.alert('Google Sign-In', 'Google authentication will be implemented later.');
    };

    const handleForgotPassword = () => {
        Alert.alert('Forgot Password', 'Password recovery will be implemented later.');
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome Back!</Text>
                        <Text style={styles.subtitle}>
                            Log in to access your groups and active bills.
                        </Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.form}>
                        <AuthInput
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={(value) => {
                                setEmail(value);
                                setErrors((prev) => ({ ...prev, email: '' }));
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            error={errors.email}
                        />

                        <AuthInput
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={(value) => {
                                setPassword(value);
                                setErrors((prev) => ({ ...prev, password: '' }));
                            }}
                            secureTextEntry
                            autoCapitalize="none"
                            error={errors.password}
                        />

                        {/* Remember Me & Forgot Password */}
                        <View style={styles.optionsRow}>
                            <Pressable
                                style={styles.rememberContainer}
                                onPress={() => setRememberMe(!rememberMe)}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        rememberMe && styles.checkboxChecked,
                                    ]}
                                >
                                    {rememberMe && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>

                                <Text style={styles.rememberText}>Remember me</Text>
                            </Pressable>

                            <Pressable onPress={handleForgotPassword}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </Pressable>
                        </View>

                        {/* Sign In Button */}
                        <AuthButton
                            title="Sign In"
                            onPress={handleLogin}
                            loading={isLoading}
                            disabled={isLoading}
                            style={styles.signInButton}
                        />
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Login */}
                    <View style={styles.socialContainer}>
                        <AuthButton
                            title="Continue with Google"
                            variant="social"
                            onPress={handleGoogleLogin}
                            icon={
                                <Image
                                    source={require('../../assets/images/google.png')}
                                    style={styles.socialIcon}
                                    resizeMode="contain"
                                />
                            }
                        />
                    </View>

                    {/* Register Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Don't have an account?{' '}
                        </Text>

                        <Pressable
                            onPress={() => router.push('/(auth)/register')}
                        >
                            <Text style={styles.registerText}>Sign up</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center',
        paddingHorizontal: 28,
        paddingVertical: 40
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontFamily: 'Montreux',
        fontSize: 30,
        color: '#173B67',
        marginBottom: 10,
        textAlign: 'center',
    },

    subtitle: {
        fontFamily: 'MontserratRegular',
        fontSize: 14,
        color: '#777777',
        lineHeight: 21,
        textAlign: 'center',
        maxWidth: 360,
        paddingHorizontal: 44
    },
    form: {
        width: '100%',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
        marginBottom: 28,
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#A0A0A0',
        borderRadius: 10,
        marginRight: 9,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxChecked: {
        backgroundColor: '#173B67',
        borderColor: '#173B67',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    rememberText: {
        fontSize: 12,
        color: '#555555',
    },
    forgotText: {
        fontSize: 12,
        color: '#173B67',
        fontWeight: '600',
    },
    signInButton: {
        marginBottom: 0,
        marginTop: 40
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#DDDDDD',
    },
    dividerText: {
        fontSize: 12,
        color: '#999999',
        marginHorizontal: 14,
    },
    socialContainer: {
        width: '100%',
    },
    socialIcon: {
        width: 20,
        height: 20
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 13,
        color: '#777777',
    },
    registerText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#173B67',
    },
});
