import urllib.request
import json
import os

url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson"
target_file = "/home/samu2505/SAAS/tradenexus-ai-sales-agent/components/landCoordinates.json"

print("Fetching GeoJSON from GitHub...")
try:
    with urllib.request.urlopen(url) as response:
        geojson_data = json.loads(response.read().decode())
except Exception as e:
    print("Error fetching URL:", e)
    # Exit if we can't get it
    exit(1)

print("Simplifying geometry...")
land_points = []

# Natural Earth land.geojson has FeatureCollection
for feature in geojson_data.get("features", []):
    geom = feature.get("geometry", {})
    geom_type = geom.get("type")
    coordinates = geom.get("coordinates", [])

    if geom_type == "Polygon":
        # list of rings
        for ring in coordinates:
            # We want to sample points. Let's take every 2nd or 3rd coordinate to keep it light
            # A 110m resolution polygon is already very simple
            for i, pt in enumerate(ring):
                if i % 3 == 0:
                    lon, lat = pt
                    land_points.append([round(lat, 2), round(lon, 2)])
    elif geom_type == "MultiPolygon":
        for polygon in coordinates:
            for ring in polygon:
                for i, pt in enumerate(ring):
                    if i % 3 == 0:
                        lon, lat = pt
                        land_points.append([round(lat, 2), round(lon, 2)])

print(f"Extracted {len(land_points)} coordinate points.")

# Write to target JSON file
with open(target_file, "w") as f:
    json.dump(land_points, f)

print("Successfully saved compressed coordinates to:", target_file)
