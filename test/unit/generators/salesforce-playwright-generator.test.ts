/*
 * Copyright 2026, Jaime Terrats.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { expect } from 'chai';
import { generateSalesforcePlaywrightUtils } from '../../../src/generators/salesforce-playwright-generator.js';

describe('generateSalesforcePlaywrightUtils()', () => {
  const utils = generateSalesforcePlaywrightUtils();

  it('returns exactly two files', () => {
    expect(Object.keys(utils)).to.have.lengthOf(2);
  });

  it('includes salesforce-auth.ts at correct path', () => {
    expect(utils).to.have.property('src/utils/salesforce-auth.ts');
  });

  it('includes salesforce-api.ts at correct path', () => {
    expect(utils).to.have.property('src/utils/salesforce-api.ts');
  });

  describe('salesforce-auth.ts', () => {
    const auth = utils['src/utils/salesforce-auth.ts'];

    it('exports getSalesforceOrgInfo', () => {
      expect(auth).to.include('export function getSalesforceOrgInfo');
    });

    it('exports navigateWithCLISession', () => {
      expect(auth).to.include('export async function navigateWithCLISession');
    });

    it('exports useSalesforceCLISession', () => {
      expect(auth).to.include('export async function useSalesforceCLISession');
    });

    it('uses execFileSync not exec', () => {
      expect(auth).to.include('execFileSync');
      expect(auth).to.not.include('execSync(');
    });

    it('does not use shell interpolation', () => {
      expect(auth).to.not.match(/exec\s*\(`/);
    });

    it('uses args array for sf command', () => {
      expect(auth).to.include("'org', 'display', '--json'");
    });

    it('reads accessToken from CLI result not DOM cookies', () => {
      expect(auth).to.include('data.result.accessToken');
      expect(auth).to.not.include('document.cookie');
    });

    it('respects SF_TARGET_ORG env var', () => {
      expect(auth).to.include('SF_TARGET_ORG');
    });

    it('exports SalesforceOrgInfo interface', () => {
      expect(auth).to.include('export interface SalesforceOrgInfo');
    });
  });

  describe('salesforce-api.ts', () => {
    const api = utils['src/utils/salesforce-api.ts'];

    it('exports executeSoqlQuery', () => {
      expect(api).to.include('export async function executeSoqlQuery');
    });

    it('exports createRecord', () => {
      expect(api).to.include('export async function createRecord');
    });

    it('exports updateRecord', () => {
      expect(api).to.include('export async function updateRecord');
    });

    it('exports deleteRecord', () => {
      expect(api).to.include('export async function deleteRecord');
    });

    it('exports SalesforceQueryResult interface', () => {
      expect(api).to.include('export interface SalesforceQueryResult');
    });

    it('uses token from getSalesforceOrgInfo not DOM', () => {
      expect(api).to.include('getSalesforceOrgInfo');
      expect(api).to.not.include('document.cookie');
      expect(api).to.not.include('page.evaluate');
    });

    it('uses Bearer token in Authorization header', () => {
      expect(api).to.include('Bearer');
    });

    it('defines API_VERSION constant', () => {
      expect(api).to.include('API_VERSION');
    });
  });
});
