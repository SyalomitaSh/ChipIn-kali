import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { register } from '@/services/auth.service';
import { ApiError } from '@/services/api';

import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';

export default function RegisterScreen() {
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [errors, setErrors] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: '',
    });


    const validateForm = () => {
        const newErrors = {
            fullName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            terms: '',
        };

        const trimmedFullName = fullName.trim();
        const normalizedUsername = username.trim().toLowerCase();
        const normalizedEmail = email.trim();

        // Full Name Validation
        if (!trimmedFullName) {
            newErrors.fullName = 'Full name is required';
        } else if (
            trimmedFullName.length < 2 ||
            trimmedFullName.length > 50
        ) {
            newErrors.fullName = 'Name must be 2–50 characters';
        }

        // Username Validation
        if (!normalizedUsername) {
            newErrors.username = 'Username is required';
        } else if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
            newErrors.username =
                'Username must be 3–30 characters and contain only lowercase letters, numbers, or underscores';
        }

        // Email Validation
        if (!normalizedEmail) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password Validation
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        // Confirm Password Validation
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Terms & Conditions Validation
        if (!agreeToTerms) {
            newErrors.terms = 'You must agree to the Terms & Conditions';
        }

        setErrors(newErrors);

        return !Object.values(newErrors).some((error) => error !== '');
    };



    const handleRegister = async () => {
        if (isLoading || !validateForm()) return;

        setIsLoading(true);

        try {
            const response = await register({
                username: username.trim().toLowerCase(),
                full_name: fullName.trim(),
                email: email.trim().toLowerCase(),
                password: password,
            });

            if (response.data.requires_email_confirmation) {
                Alert.alert(
                    'Registration Successful',
                    'Please check your email to confirm your account.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/(auth)/login'),
                        },
                    ],
                );

                return;
            }

            Alert.alert(
                'Registration Successful',
                'Your account has been created. Please sign in to continue.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(auth)/login'),
                    },
                ],
            );
        } catch (error) {
            if (error instanceof ApiError) {
                switch (error.code) {
                    case 'USERNAME_TAKEN':
                        Alert.alert('Registration Failed', 'Username is already taken.');
                        break;

                    case 'EMAIL_TAKEN':
                        Alert.alert('Registration Failed', 'Email is already registered.');
                        break;

                    case 'INVALID_EMAIL':
                        Alert.alert('Registration Failed', 'Please enter a valid email.');
                        break;

                    case 'RATE_LIMITED':
                        Alert.alert('Too Many Requests', 'Please try again later.');
                        break;

                    default:
                        Alert.alert('Registration Failed', error.message);
                }
            } else {
                Alert.alert(
                    'Registration Failed',
                    'Unable to connect to the server. Please try again.',
                );
            }
        } finally {
            setIsLoading(false);
        }
    };


    const handleGoogleRegister = () => {
        Alert.alert('Google Sign-Up', 'Google authentication will be implemented later.');
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
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>
                            Start splitting bills and tracking shared expenses effortlessly.
                        </Text>
                    </View>

                    {/* Register Form */}
                    <View style={styles.form}>
                        <AuthInput
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChangeText={(value) => {
                                setFullName(value);
                                setErrors((prev) => ({ ...prev, fullName: '' }));
                            }}
                            autoCapitalize="words"
                            error={errors.fullName}
                        />

                        <AuthInput
                            label="Username"
                            placeholder="Choose a username"
                            value={username}
                            onChangeText={(value) => {
                                setUsername(value);
                                setErrors((prev) => ({ ...prev, username: '' }));
                            }}
                            autoCapitalize="none"
                            error={errors.username}
                        />

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
                            placeholder="Create a password"
                            value={password}
                            onChangeText={(value) => {
                                setPassword(value);
                                setErrors((prev) => ({
                                    ...prev,
                                    password: '',
                                    confirmPassword: '',
                                }));
                            }}
                            secureTextEntry
                            autoCapitalize="none"
                            error={errors.password}
                        />

                        <Text style={styles.passwordHint}>
                            Password must be at least 8 characters
                        </Text>

                        <AuthInput
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={(value) => {
                                setConfirmPassword(value);
                                setErrors((prev) => ({
                                    ...prev,
                                    confirmPassword: '',
                                }));
                            }}
                            secureTextEntry
                            autoCapitalize="none"
                            error={errors.confirmPassword}
                        />

                        {/* Terms and Conditions */}
                        <Pressable
                            style={styles.termsContainer}
                            onPress={() => {
                                setAgreeToTerms(!agreeToTerms);
                                setErrors((prev) => ({ ...prev, terms: '' }));
                            }}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    agreeToTerms && styles.checkboxChecked,
                                ]}
                            >
                                {agreeToTerms && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </View>

                            <Text style={styles.termsText}>
                                I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text>
                            </Text>
                        </Pressable>

                        {errors.terms ? (
                            <Text style={styles.errorText}>{errors.terms}</Text>
                        ) : null}

                        {/* Register Button */}
                        <AuthButton
                            title={isLoading ? 'Registering...' : 'Register'}
                            onPress={handleRegister}
                            loading={isLoading}
                            disabled={isLoading}
                            style={styles.registerButton}
                        />
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Sign-Up */}
                    <View style={styles.socialContainer}>
                        <AuthButton
                            title="Continue with Google"
                            variant="social"
                            onPress={handleGoogleRegister}
                            icon={
                                <Image
                                    source={require('../../assets/images/google.png')}
                                    style={styles.socialIcon}
                                    resizeMode="contain"
                                />
                            }
                        />

                    </View>

                    {/* Login Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Already have an account?{' '}
                        </Text>

                        <Pressable
                            onPress={() => router.push('/(auth)/login')}
                        >
                            <Text style={styles.loginText}>Sign in</Text>
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
    },
    container: {
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center',
        paddingHorizontal: 32,
        paddingTop: 96,
        paddingBottom: 80
    },
    header: {
        alignItems: 'center',
        marginBottom: 60
    },
    title: {
        fontFamily: 'Montreux',
        fontSize: 30,
        color: '#173B67',
        marginBottom: 10,
        textAlign: 'center'
    },
    subtitle: {
        fontFamily: 'MontserratRegular',
        fontSize: 14,
        color: '#777777',
        lineHeight: 21,
        textAlign: 'center'
    },
    form: {
        width: '100%',
    },
    passwordHint: {
        fontSize: 11,
        color: '#999999',
        marginTop: -12,
        marginBottom: 20,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        marginBottom: 8,
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
    termsText: {
        fontSize: 12,
        color: '#555555',
        flexShrink: 1,
    },
    termsLink: {
        color: '#173B67',
        fontWeight: '600',
    },
    errorText: {
        fontSize: 12,
        color: '#D93025',
        marginBottom: 12,
    },
    registerButton: {
        marginTop: 56,
        marginBottom: 0,
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
        marginTop: 20,
    },
    footerText: {
        fontSize: 13,
        color: '#777777',
    },
    loginText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#173B67',
    },
});