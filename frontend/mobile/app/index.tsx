
import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/onboarding');
        }, 1500);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 180,
        height: 75,
    },
});
