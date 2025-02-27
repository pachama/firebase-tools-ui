/**
 * Copyright 2022 Google LLC
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

import { renderHook } from '@testing-library/react';
import React, { Suspense } from 'react';

import { TestEmulatorConfigProvider } from '../../../common/EmulatorConfigProvider';
import { useFunctionsEmulator } from './useFunctionsEmulator';

const hostAndPort = 'pirojok:689';

describe('useFunctionsEmulator', () => {
  it('returns the emulator URL', () => {
    const wrapper: React.FC<React.PropsWithChildren<unknown>> = ({
      children,
    }) => {
      return (
        <TestEmulatorConfigProvider
          config={{
            projectId: '',
            extensions: {
              useHttps: false,
              hostAndPort,
              host: 'pirojok',
              port: 689,
            },
          }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </TestEmulatorConfigProvider>
      );
    };

    const { result } = renderHook(() => useFunctionsEmulator(), { wrapper });
    expect(result.current).toEqual(`http://${hostAndPort}`);
  });
});
