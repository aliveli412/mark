# Lodge membership rosters

- `source/As_of_06-06-2022.xlsx` — FWB original lodge export
- `fwb-roster.json` — normalized FWB import (local mock + Admin “bundled re-import”)

## Import for any lodge

Admin → Memberships → choose lodge → **Import Excel roster**.

Expected headers (FWB format):

BrotherNo, Surname, GivenNames, Prefix, Initials, Title, Suffix, HomePhone, Mobile, PostCode, Address, Address2, Address3, City, County, Email, Country, StartDate, EndDate, GrandRank, ProvRank, UnitRank (+ ids/starts/prefixes), Activity.

Import replaces that lodge’s roster.
