//import Constants from 'expo-constants';
import * as Device from "expo-device";
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from "react-native";

export interface PushNotificationState {
    notification?: Notifications.Notification;
    expoPushToken?: Notifications.ExpoPushToken;
    scheduleEventReminder?: (eventTime: number, eventID: string) => Promise<void>;
}

export const usePushNotifications = (): PushNotificationState => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: false,
            shouldShowAlert: true,
            shouldSetBadge: false,
        }),
    });

    const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    // Register for push notifications
    async function registerForPushNotificationsAsync() {
        let token;

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== "granted") {
                // alert("Failed to get push token");
            }

            // Uncomment this if we're using EAS to build
            // token = await Notifications.getExpoPushTokenAsync({
            //     projectId: Constants.expoConfig?.extra?.eas?.projectID, 
            // });

            token = await Notifications.getExpoPushTokenAsync(); //It's not generating a token and I don't know why
            console.log(`Notification token: ${token.data}`);
            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync("default", {
                    name: "default",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF2321F7C",
                });
            }
            
            return token;
        } else {
            console.log("Notifications can't be used on an emulator");
        }
    }

    useEffect(() => {
        registerForPushNotificationsAsync().then((token) => {
            setExpoPushToken(token);
            console.log(`Push Token Saved ${token?.data}`)
        });

        notificationListener.current = 
            Notifications.addNotificationReceivedListener((notification) => {
                setNotification(notification);
            });

        responseListener.current = 
            Notifications.addNotificationResponseReceivedListener((response) => {
                console.log(response);
            });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current!);
            Notifications.removeNotificationSubscription(responseListener.current!);
        };
    }, []);

    // Schedule a notification for an RSVP'd event
    const scheduleEventReminder = async (eventTime: number, eventID: string) => {
        // eventTime should be a timestamp in milliseconds when the event is happening
        const reminderTime = eventTime - 60 * 60 * 1000; // 1 hour before the event

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Event Reminder",
                body: "Don't forget, your RSVP'd event is coming up in an hour!",
                data: { eventID }, // You can pass event-specific data here
            },
            trigger: {
                type: Notifications.NotificationTriggerType.TIMESTAMP,
                timestamp: reminderTime, // When to trigger the reminder
            },
        });

        console.log("Event reminder scheduled!");
    };

    return {
        expoPushToken,
        notification,
        scheduleEventReminder,
    };
};
