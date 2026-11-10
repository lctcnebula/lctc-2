import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupSubmissions, groupDonors, filterSubmissions, filterDonors, exportSubmissions, exportDonors } from '../components/admin/DonationGroups';
import { withinDateRange } from '../lib/date-range';
import type { Donation } from '../lib/seed';
const gifts: Donation[] = [
  {id:'1',receipt:'NEW',name:'Ada',email:'ada@example.test',amount:25,freq:'once',fund:'Tools',card:'Check',createdAt:'2026-11-10T12:00:00Z'},
  {id:'2',receipt:'NEW',name:'Ada',email:'ada@example.test',amount:50,freq:'monthly',fund:'Scholarships',card:'Check',createdAt:'2026-11-10T12:00:00Z'},
  {id:'3',receipt:'OLD',name:'Ada',email:'ada@example.test',amount:100,freq:'once',fund:'Tools',card:'Check',createdAt:'2026-09-01T12:00:00Z'},
  {id:'4',receipt:'OTHER',name:'Bob',email:'bob@example.test',amount:10,freq:'once',fund:'Tools',card:'Check',createdAt:'2026-11-10T12:00:00Z'},
];
test('period filtering keeps checkout groups and sums only gifts in the selected dates',()=>{
  const period = gifts.filter(d=>withinDateRange(d.createdAt,{from:'2026-11-01',to:'2026-11-30'}));
  const subs = groupSubmissions(period);
  const selected = filterSubmissions(subs,'Ada',2);
  assert.equal(selected.length,1);
  assert.equal(selected[0].today,75);
  assert.equal(selected[0].lines.length,2);
  const donors=filterDonors(groupDonors(subs),'Ada',2);
  assert.equal(donors[0].lifetime,75);
  assert.equal(donors[0].submissions.length,1);
  assert.equal(filterDonors(groupDonors(subs),'Ada',1).length,0);
});
test('exports receive the same search/status-filtered rows as the tables',async()=>{
  const blobs: Blob[]=[];
  const previousDocument=globalThis.document;
  const create=URL.createObjectURL, revoke=URL.revokeObjectURL;
  URL.createObjectURL=(b)=>{blobs.push(b as Blob);return 'blob:test';};
  URL.revokeObjectURL=()=>{};
  Object.defineProperty(globalThis,'document',{value:{createElement:()=>({click(){}})},configurable:true});
  try {
    const rows=filterSubmissions(groupSubmissions(gifts),'NEW',0);
    exportSubmissions(rows);
    exportDonors(filterDonors(groupDonors(rows),'Ada',0));
    for(const blob of blobs){const csv=await blob.text();assert.match(csv,/Ada/);assert.doesNotMatch(csv,/OLD|Bob|OTHER/);assert.match(csv,/75/);}
  } finally {
    URL.createObjectURL=create;URL.revokeObjectURL=revoke;
    Object.defineProperty(globalThis,'document',{value:previousDocument,configurable:true});
  }
});
