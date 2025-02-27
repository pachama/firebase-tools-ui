/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getByRole, getByText, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';

import {
  EmulatorConfigProvider,
  TestEmulatorConfigProvider,
} from '../common/EmulatorConfigProvider';
import { Home } from './index';

it('renders fetching placeholder when fetching config', () => {
  const { getByText } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider config={undefined}>
        <Home />
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );
  expect(getByText('Overview Page Loading...')).not.toBeNull();
});

it('renders an overview when config is loaded', () => {
  const { getByText } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider config={{ projectId: 'example' }}>
        <Home />
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );
  expect(getByText('Emulator overview')).not.toBeNull();
});

it('shows port for emulator that are loaded and N/A for not loaded', () => {
  const { getByTestId } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider
        config={{
          projectId: 'example',
          database: {
            host: 'localhost',
            port: 9000,
            hostAndPort: 'localhost:9000',
            useHttps: false
          },
        }}
      >
        <Home />
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );
  // Database Emulator is running.
  const databaseCard = getByTestId(`emulator-info-database`);
  expect(getByText(databaseCard, '9000')).not.toBeNull();
  expect(getByText(databaseCard, 'Go to emulator')).not.toBeNull();

  // Firestore Emulator is not running.
  const firestoreCard = getByTestId(`emulator-info-firestore`);
  expect(getByText(firestoreCard, 'Off')).not.toBeNull();
  expect(getByText(firestoreCard, 'N/A')).not.toBeNull(); // Port is N/A
});

it('shows hosting emulator card', () => {
  const { getByTestId } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider
        config={{
          projectId: 'example',
          hosting: {
            host: 'localhost',
            port: 5000,
            hostAndPort: 'localhost:5000',
            useHttps: true
          },
        }}
      >
        <Home />
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );

  const card = getByTestId(`emulator-info-hosting`);
  expect(getByText(card, '5000')).not.toBeNull();
  expect(getByText(card, 'Hosting emulator')).not.toBeNull();
});

it('links to the hosting website externally', () => {
  const { getByTestId } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider
        config={{
          projectId: 'example',
          hosting: {
            host: 'localhost',
            port: 5000,
            hostAndPort: 'localhost:5000',
            useHttps: true
          },
        }}
      >
        <Home></Home>
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );

  const card = getByTestId(`emulator-info-hosting`);
  expect(getByText(card, '5000')).not.toBeNull();
  const link = getByRole(card, 'link', {
    name: 'View website',
  }) as HTMLAnchorElement;
  expect(link.href).toBe('http://localhost:5000/');
  expect(link.target).toBe('_blank');
});

it('shows extensions emulator card', () => {
  const { getByTestId } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider
        config={{
          projectId: 'example',
          extensions: {
            host: 'localhost',
            port: 1234,
            hostAndPort: 'localhost:1234',
            useHttps: true
          },
        }}
      >
        <Home></Home>
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );

  const card = getByTestId(`emulator-info-extensions`);
  expect(getByText(card, '1234')).not.toBeNull();
  expect(getByText(card, 'Extensions emulator')).not.toBeNull();
});

it('shows pubsub emulator card', () => {
  const { getByTestId } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider
        config={{
          projectId: 'example',
          pubsub: {
            host: 'localhost',
            port: 8085,
            hostAndPort: 'localhost:8085',
            useHttps: true
          },
        }}
      >
        <Home></Home>
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );

  const card = getByTestId(`emulator-info-pubsub`);
  expect(getByText(card, '8085')).not.toBeNull();
  expect(getByText(card, 'PubSub emulator')).not.toBeNull();
});

it('shows storage emulator card', () => {
  const { getByTestId } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider
        config={{
          projectId: 'example',
          storage: {
            host: 'localhost',
            port: 9199,
            hostAndPort: 'localhost:9199',
            useHttps: true
          },
        }}
      >
        <Home></Home>
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );

  const card = getByTestId(`emulator-info-storage`);
  expect(getByText(card, '9199')).not.toBeNull();
  expect(getByText(card, 'Storage')).not.toBeNull();
});

it('shows button for function emulator logs', () => {
  const { getByTestId } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider
        config={{
          projectId: 'example',
          functions: {
            host: 'localhost',
            port: 5001,
            hostAndPort: 'localhost:5001',
            useHttps: true
          },
        }}
      >
        <Home></Home>
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );
  const card = getByTestId(`emulator-info-functions`);
  expect(getByText(card, '5001')).not.toBeNull();
  expect(getByText(card, 'View logs')).not.toBeNull();
});

it('renders all emulators as "off" when error loading config', () => {
  // We don't need to show the error here because there is an app-wide
  // disconnected overlay. Just keep the layout and show everything as "off".
  const { getByTestId } = render(
    <MemoryRouter>
      <TestEmulatorConfigProvider config={null}>
        <Home />
      </TestEmulatorConfigProvider>
    </MemoryRouter>
  );

  for (const emulator of ['database', 'firestore', 'functions', 'extensions']) {
    const card = getByTestId(`emulator-info-${emulator}`);
    expect(getByText(card, 'Off')).not.toBeNull();
    expect(getByText(card, 'N/A')).not.toBeNull(); // Port is N/A
  }
});
