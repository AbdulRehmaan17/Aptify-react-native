/**
 * Example Usage of UI Components
 * This file demonstrates how to use all the reusable UI components
 */

import React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { Card, Button, Text, Input, Badge } from './index';

export function UIComponentsExample() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Card Example */}
        <Card>
          <Text variant="title">Card Title</Text>
          <Text variant="body" style={{ marginTop: 8 }}>
            This is body text inside a card component.
          </Text>
          <Text variant="muted" style={{ marginTop: 4 }}>
            This is muted text with reduced opacity.
          </Text>
        </Card>

        {/* Input Examples */}
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Input
          label="Email with Error"
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          error="Please enter a valid email"
        />

        {/* Badge Examples */}
        <Card>
          <Text variant="title">Status Badges</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <Badge text="Default" variant="default" />
            <Badge text="Success" variant="success" />
            <Badge text="Warning" variant="warning" />
            <Badge text="Error" variant="error" />
          </View>
        </Card>

        {/* Button Examples */}
        <Button
          title="Primary Button"
          onPress={() => console.log('Primary pressed')}
          variant="primary"
        />

        <Button
          title="Secondary Button"
          onPress={() => console.log('Secondary pressed')}
          variant="secondary"
          style={{ marginTop: 12 }}
        />

        <Button
          title="Outline Button"
          onPress={() => console.log('Outline pressed')}
          variant="outline"
          style={{ marginTop: 12 }}
        />

        <Button
          title="Disabled Button"
          onPress={() => {}}
          disabled
          style={{ marginTop: 12 }}
        />

        <Button
          title="Loading Button"
          onPress={() => {}}
          loading
          style={{ marginTop: 12 }}
        />

        {/* Complete Form Example */}
        <Card>
          <Text variant="title">Complete Form Example</Text>
          
          <Input
            label="Full Name"
            placeholder="Enter your name"
            style={{ marginTop: 12 }}
          />

          <Input
            label="Email Address"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginTop: 12 }}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <Button
              title="Cancel"
              onPress={() => {}}
              variant="outline"
              style={{ flex: 1 }}
            />
            <Button
              title="Submit"
              onPress={() => {}}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
