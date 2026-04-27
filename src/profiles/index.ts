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

export type { Profile, ProfileId } from './types.js';
export { PROFILE_TOOLSETS } from './toolsets.js';

export { developerProfile } from './developer.js';
export { architectProfile } from './architect.js';
export { baProfile } from './ba.js';
export { pmProfile } from './pm.js';
export { mulesoftProfile } from './mulesoft.js';
export { uxProfile } from './ux.js';
export { cgcloudProfile } from './cgcloud.js';
export { devopsProfile } from './devops.js';
export { qaProfile } from './qa.js';
export { crmaProfile } from './crma.js';
export { commerceProfile } from './commerce.js';
export { data360Profile } from './data360.js';
export { adminProfile } from './admin.js';
export { sfmcProfile } from './sfmc.js';
export { securityProfile } from './security.js';
export { serviceProfile } from './service.js';
export { cpqProfile } from './cpq.js';
export { omnistudioProfile } from './omnistudio.js';
export { fslProfile } from './fsl.js';

import { developerProfile } from './developer.js';
import { architectProfile } from './architect.js';
import { baProfile } from './ba.js';
import { pmProfile } from './pm.js';
import { mulesoftProfile } from './mulesoft.js';
import { uxProfile } from './ux.js';
import { cgcloudProfile } from './cgcloud.js';
import { devopsProfile } from './devops.js';
import { qaProfile } from './qa.js';
import { crmaProfile } from './crma.js';
import { commerceProfile } from './commerce.js';
import { data360Profile } from './data360.js';
import { adminProfile } from './admin.js';
import { sfmcProfile } from './sfmc.js';
import { securityProfile } from './security.js';
import { serviceProfile } from './service.js';
import { cpqProfile } from './cpq.js';
import { omnistudioProfile } from './omnistudio.js';
import { fslProfile } from './fsl.js';
import type { Profile } from './types.js';

export const ALL_PROFILES: Profile[] = [
  developerProfile,
  architectProfile,
  baProfile,
  pmProfile,
  mulesoftProfile,
  uxProfile,
  cgcloudProfile,
  devopsProfile,
  qaProfile,
  crmaProfile,
  commerceProfile,
  data360Profile,
  adminProfile,
  sfmcProfile,
  securityProfile,
  serviceProfile,
  cpqProfile,
  omnistudioProfile,
  fslProfile,
];
