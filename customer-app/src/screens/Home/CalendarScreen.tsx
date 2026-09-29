import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, Button } from '../../components';
import { useJobStore } from '../../store';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Calendar'>;
};

const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
];

const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createJob, setCreateJobField } = useJobStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(
    createJob.jobStartTime ? new Date(createJob.jobStartTime).toISOString().split('T')[0] : todayStr
  );
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');

  const handleConfirm = () => {
    if (!selectedDate) {
      Toast.show({
        type: 'error',
        text1: 'Date Required',
        text2: 'Please pick an appointment date',
      });
      return;
    }

    // Combine date + time
    const [time, modifier] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const [year, month, day] = selectedDate.split('-').map(Number);
    const combinedDate = new Date(year, month - 1, day, hours, minutes, 0);

    const now = new Date();
    if (combinedDate.getTime() < now.getTime() - 60000) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Time',
        text2: 'Please select a future appointment time',
      });
      return;
    }

    setCreateJobField('jobStartTime', combinedDate.toISOString());

    // Match iOS: weekDay = getDayOfWeekFC() - 1 (0-based, Sunday=0)
    const weekDay = combinedDate.getDay(); // 0=Sun, 1=Mon, … 6=Sat
    setCreateJobField('weekDay', weekDay);

    // Match iOS: TimeZone.current string e.g. "America/New_York"
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setCreateJobField('timeZone', timeZone);

    Toast.show({
      type: 'success',
      text1: 'Date & Time Scheduled',
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header title="Schedule Appointment" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.cardTitle}>Select Date</Text>
          </View>

          <Calendar
            current={selectedDate}
            minDate={todayStr}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: Colors.ButtonPrimaryColor,
                selectedTextColor: '#FFFFFF',
              },
            }}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#64748B',
              selectedDayBackgroundColor: Colors.ButtonPrimaryColor,
              selectedDayTextColor: '#ffffff',
              todayTextColor: Colors.ButtonPrimaryColor,
              dayTextColor: '#1E293B',
              textDisabledColor: '#CBD5E1',
              arrowColor: Colors.ButtonPrimaryColor,
              monthTextColor: Colors.TitleColor,
              textDayFontWeight: '600',
              textMonthFontWeight: '800',
              textDayHeaderFontWeight: '700',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendarWidget}
          />
        </View>

        {/* Time Slot Picker */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.cardTitle}>Select Time Slot</Text>
          </View>
          <Text style={styles.cardSubtitle}>Available starting times for stylists</Text>

          <View style={styles.timeSlotsGrid}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotPill, isSelected && styles.slotPillActive]}
                  onPress={() => setSelectedTime(slot)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title={`Confirm ${selectedDate} at ${selectedTime}`}
          onPress={handleConfirm}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  calendarWidget: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '29%',
  },
  slotPillActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  slotText: {
    fontSize: 13,
    fontWeight: FontWeights.semibold,
    color: '#475569',
  },
  slotTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeights.bold,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: Spacing.base,
  },
});

export default CalendarScreen;
