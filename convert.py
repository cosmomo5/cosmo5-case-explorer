#!/usr/bin/env python3
"""
Convert Cosmo5 case study CSV export to cases.json.

Usage:
    python convert.py

Input:  data/CASE STUDY VAULT - Sheet1.csv
Output: cases.json
"""

import csv
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent
CSV_PATH = ROOT / 'data' / 'CASE STUDY VAULT - Sheet1.csv'
JSON_PATH = ROOT / 'cases.json'

# Map full country names (lowercased, after stripping 3-letter code) → canonical globe name
FULL_NAME_TO_COUNTRY = {
    'spain': 'Spain',
    'italy': 'Italy',
    'germany': 'Germany',
    'france': 'France',
    'netherlands, kingdom of the': 'Netherlands',
    'netherlands': 'Netherlands',
    'united kingdom of great britain and northern ireland': 'UK',
    'united kingdom': 'UK',
    'switzerland': 'Switzerland',
    'austria': 'Austria',
    'portugal': 'Portugal',
    'united states of america': 'US',
    'united states': 'US',
    'canada': 'Canada',
    'hong kong': 'Hong Kong',
    'australia': 'Australia',
    'japan': 'Japan',
    'argentina': 'Argentina',
}

COUNTRY_REGION = {
    'Spain': 'Europe', 'Italy': 'Europe', 'Germany': 'Europe',
    'France': 'Europe', 'Netherlands': 'Europe', 'UK': 'Europe',
    'Switzerland': 'Europe', 'Austria': 'Europe', 'Portugal': 'Europe',
    'US': 'Americas', 'Canada': 'Americas', 'Argentina': 'Americas',
    'Hong Kong': 'Asia-Pacific', 'Australia': 'Asia-Pacific', 'Japan': 'Asia-Pacific',
}


def parse_market(raw):
    """
    Parse Market field to canonical country names.
    Format: 'ESP Spain' or 'DEU Germany, ITA Italy, USA United States of America'
    Splits only on ', ' followed by a 3-letter uppercase code to avoid splitting
    country names that contain commas (e.g. 'Netherlands, Kingdom of the').
    """
    if not raw.strip():
        return []
    # Split on ", " when followed by an optional quote then 3 uppercase letters + space
    parts = re.split(r', "?(?=[A-Z]{3}\s)', raw)
    countries = []
    seen = set()
    for part in parts:
        part = part.strip().strip('"')  # remove literal quotes the CSV may preserve
        # Strip leading 3-letter country code
        m = re.match(r'^[A-Z]{3}\s+(.+)$', part)
        full_name = m.group(1).strip() if m else part
        canonical = FULL_NAME_TO_COUNTRY.get(full_name.lower(), full_name)
        if canonical and canonical not in seen:
            countries.append(canonical)
            seen.add(canonical)
    return countries


def parse_services(raw):
    """'Amazon, Video Ads' → ['Amazon', 'Video Ads']"""
    if not raw.strip():
        return []
    return [s.strip() for s in raw.split(',') if s.strip()]


def parse_permission(raw):
    """'Yes, it can be shared...' → True, 'No (internal use only)' → False"""
    return raw.lower().startswith('yes')


def parse_metrics(row):
    """Extract up to 5 Result pairs into [{value, label}]."""
    metrics = []
    for i in range(1, 6):
        value = row.get(f'Result{i}Num', '').strip()
        label = row.get(f'Result{i}Qual', '').strip()
        if value and label:
            metrics.append({'value': value, 'label': label})
    return metrics


def clean_name(raw):
    """Handle multi-line owner names - join with ' & '."""
    names = [n.strip() for n in raw.replace('\r', '').split('\n') if n.strip()]
    return ' & '.join(names)


def convert():
    if not CSV_PATH.exists():
        print(f"ERROR: CSV not found at {CSV_PATH}")
        print("Export your Google Sheet as CSV and place it in the data/ folder.")
        return

    cases = []
    skipped = 0

    with open(CSV_PATH, encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            client = row.get('ClientName', '').strip()
            case_id = row.get('Case Study ID', '').strip()

            if not client or not case_id:
                skipped += 1
                continue

            countries = parse_market(row.get('Market', ''))
            primary = countries[0] if countries else ''
            region = COUNTRY_REGION.get(primary, 'Unknown')

            case = {
                'id': case_id,
                'client': client,
                'year': int(row.get('Year', '0') or '0'),
                'services': parse_services(row.get('Expertise', '')),
                'countries': countries,
                'region': region,
                'permission': parse_permission(row.get('Confidentiality', '')),
                'contributor_source': row.get('Publisher: Cosmo5 Group vs external partner', '').strip(),
                'contributor_name': clean_name(row.get('OwnerName', '')),
                'title': row.get('CaseSummary', '').strip(),
                'challenge': row.get('CaseChallenge', '').strip(),
                'approach': row.get('CaseApproach', '').strip(),
                'metrics': parse_metrics(row),
            }
            cases.append(case)

    # Sort: newest first, then alphabetically by client
    cases.sort(key=lambda c: (-c['year'], c['client'].lower()))

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)

    # Summary
    total = len(cases)
    public = sum(1 for c in cases if c['permission'])
    years = sorted(set(c['year'] for c in cases))
    country_counts = Counter(cc for c in cases for cc in c['countries'])
    service_counts = Counter(s for c in cases for s in c['services'])

    print(f"\nDone: {total} cases written to cases.json")
    if skipped:
        print(f"  {skipped} rows skipped (missing client or ID)")
    print(f"  {public} public / {total - public} internal")
    print(f"  Years: {years}")
    print(f"\n  Countries ({len(country_counts)}):")
    for country, count in country_counts.most_common():
        print(f"    {country}: {count}")
    print(f"\n  Services ({len(service_counts)}):")
    for svc, count in service_counts.most_common():
        print(f"    {svc}: {count}")

    unknowns = [c['countries'] for c in cases if 'Unknown' in c.get('region', '')]
    if unknowns:
        print(f"\n  WARNING: {len(unknowns)} cases with unrecognised country - check MARKET_TO_COUNTRY mapping")


if __name__ == '__main__':
    convert()
