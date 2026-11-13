# Lodge membership rosters

- `source/As_of_06-06-2022.xlsx` — FWB original lodge export
- `fwb-roster.json` — normalized FWB import (local mock + Admin “bundled re-import”)

## Import for any lodge

Admin → Memberships → choose lodge → **Import Excel roster**.

Expected headers (FWB format) — all imported into the member record and shown on the member dashboard:

BrotherNo, Surname, GivenNames, Prefix, Initials, Title, Suffix, HomePhone, Mobile, PostCode, Address, Address2, Address3, City, County, Email, Country, StartDate, EndDate, GrandRank, ProvRank, UnitRank, GrandRankId, ProvRankId, UnitRankId, UnitRankStart, ProvRankStart, GrandRankStart, UnitPrefix, ProvPrefix, GrandPrefix, Activity.

Import replaces that lodge’s roster. Matched members see Identity, Contact, Address, Ranks, and Dues on `/sites/[slug]/membership`.
