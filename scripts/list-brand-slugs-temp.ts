import { sheets, auth } from "@googleapis/sheets";
import type { JWT as JWTType } from "google-auth-library";

const SHEET_ID = "1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0";
const PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDF8cwGQrwLG1OW\n8nm4PbjVCT+ieZDuX7A/qmoY5t2CL1DcZVNyB7H2j59Uat8BS5qbkSfVRJKINJ4W\njsswgEFjDgsVGpGDlNhLqiiIiqXNIsS0+0kgdX6esgKjeoGGX3QsNoTnJq4rXcMg\nXzUKfKbdQSfkyiEeDrnAyTNdteznJ0SINjZ1ptdHqQ+q1JFYt0JkV+bpgBXzQbtD\nKuLnZUNE3j5/UQ9JvdwPT+kK88UGPKlSi7ugiskD5X2IDE170BjblWJlcibDqmby\nhc/cTHhPnyw1iEHB2F87ktaPT1whYhp+Ih6JVe0VUd0Ll/h8ij6DEGJRI+a+cwdR\n6a3jmB2nAgMBAAECggEAPr6ks59XyBWDa6e02agG/NCPsUrjnAwM7EFynC4iLPAe\nq54a01yJFuTz1miCBAEZIxLiE4JHCJHVQsVEtz0QfPuom6nuUk1OOr3XV2DLqbjJ\nrayxw247EsbOe0+L2zJKuvEVM8hZEToJbit/vrFAm4XZxXYlBUgZrXiZpazTSXnk\nUvjOS9LL9bgB22sX4IF2gvOXj12pf1PVWZZQHLnb1YFrUYOHknDdVaZGyxYrcNuL\nDvxd5Q2UpS7PXGUA1XI4DY8XZ2yKUZc7cD4K+cCecOhVrlBDPG4GStUB7GFzv6tU\nfQ7e01IlvMOs0UM2ehyFSOBi/9qT0ahn3at1tlOKwQKBgQDhUMo40iTuyEFmsbgl\n153l+/iU8O3OA6xSuwecW40qQdrSOeO6w3OsbPCOWTiOxXJwCN7kXQYLUpWhZNOw\njGs5M72gOM5UGUIXLNTKK+CIpMkacai7aTPl4QhiyfqoHW5BdmlPmF8MzlSQTCCz\npC3iXNQXE/q3JODqbr8eUD+FsQKBgQDg5sP8mIbEI2BeuJ/3IUIWrbNoHbkJ8EHf\nwKfZ5J69NmjuMcYLB61KiqSayD79Ff31CTUyiSaFtjLYOoguMbqGfQr8bn7IaUXq\n4I/umSLO/gg95gJBv1PfQU/PQ9jz+67Jhd54HEF3kay2PyhORLFyMMN0hLB5ETmp\n3NcqbiO21wKBgQDMkhy5EFuGDX4L7ooCmcz8FhVxrXpMVVttVfCoDxuRZW929iaE\n2Ja608JpjCpkvnKTtAojjy5As3+1pKTrI+LqccbWpRz4kGJIRmUBFmtrxSnt/4oy\ndmcvbWy+vSH+55HGj+s34GFUcDWpOeVrFUKvxpauSW6WQD6Ru3F85WF3UQKBgCPe\nKdubJ8MYMUJqB3kOYM/lG/u64cvn+VmKDDr/7yEWEF4Mqh0QOF7vBZl53jHW1A3E\nTiulG/OvPySlERrs62aPgrUHmki0IWZ4MfxHh/mjIgVdLXb24JV2gRf5JhyjQxj4\ntKZLO1WqcfUO1YrGAdbIWCO5Fbv5N00T32zw69k5AoGAd1QW30gZEjJ75M9STVJy\nED85EIowmDbDu3yhDKdH2TGD8KrrtSLlZMMquMi5C4JIr1tpOGvElGMVtBdBzmrY\nm+lvFfvExEpQWmLhwuuTLyZ1nBCerLC5mdqnNil4JWZkm54Ms3An9U+WQZOq56gy\nhBThtLbHZBgNbiHpHf5AWMA=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n');

async function main() {
  const jwtAuth = new auth.JWT({
    email: "counter-portal-website@counter-portal-493716.iam.gserviceaccount.com",
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  }) as unknown as JWTType;
  const client = sheets({ version: "v4", auth: jwtAuth });
  const resp = await client.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "brands!A2:Y200",
  });
  const rows = resp.data.values ?? [];
  rows.forEach((r: string[]) => { if (r[0]?.trim()) console.log(r[0].trim()); });
}

main().catch(e => { console.error(e.message); process.exit(1); });
