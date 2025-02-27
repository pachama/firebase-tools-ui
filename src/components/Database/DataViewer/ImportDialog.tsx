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
import { Checkbox } from '@rmwc/checkbox';
import {
  Dialog,
  DialogActions,
  DialogButton,
  DialogContent,
  DialogTitle,
} from '@rmwc/dialog';
import firebase from 'firebase';
import * as React from 'react';
import { useState } from 'react';

import { Callout } from '../../common/Callout';
import { useConfig } from '../../common/EmulatorConfigProvider';
import { Field } from '../../common/Field';
import { FileField } from '../../common/FileField';
import { Spinner } from '../../common/Spinner';
import { DatabaseApi } from '../api';
import styles from './ImportDialog.module.scss';

export interface Props {
  api: DatabaseApi;
  reference: firebase.database.Reference;
  droppedFile?: File;
  onComplete: (reference?: firebase.database.Reference, file?: File) => void;
}

export const ImportDialog: React.FC<React.PropsWithChildren<Props>> = ({
  api,
  reference,
  onComplete,
  droppedFile,
}) => {
  const functionsEmulatorRunning = !!useConfig().functions;
  const [file, setFile] = useState<File | undefined>(droppedFile);
  const [executeFunctions, setExecuteFunctions] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (file) {
      try {
        setIsImporting(true);
        await api.importFile(reference, file, {
          disableTriggers: !functionsEmulatorRunning || !executeFunctions,
        });
        onComplete(reference, file);
      } catch (err: any) {
        setError(err.message);
      }
      setIsImporting(false);
    }
  };

  const path = new URL(reference.toString()).pathname;

  return (
    <Dialog renderToPortal open onClose={() => onComplete()}>
      <form onSubmit={onSubmit} className={styles.container}>
        <DialogTitle>Import JSON</DialogTitle>
        <DialogContent onSubmit={onSubmit}>
          <Callout aside type="warning">
            All data at this location will be overwritten
          </Callout>
          <Field
            disabled
            name="location"
            label="Data location"
            value={path}
            type="text"
          />
          <FileField
            name="file"
            accept={{ 'application/json': ['.json'] }}
            label="Data (JSON)"
            required
            value={file?.name || 'Drop a file, or click to select'}
            onFiles={(files) => setFile(files[0])}
            error={error}
          />
          {functionsEmulatorRunning && (
            <div>
              <Checkbox
                label="Also execute database triggers in the Functions emulator"
                checked={executeFunctions}
                onChange={(event) => {
                  setExecuteFunctions(event.currentTarget.checked);
                }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <DialogButton action="close" type="button" theme="secondary">
            Cancel
          </DialogButton>
          <DialogButton type="submit" unelevated>
            Import
          </DialogButton>
        </DialogActions>
      </form>
      {isImporting && <Spinner cover scrim message="Importing..." />}
    </Dialog>
  );
};
