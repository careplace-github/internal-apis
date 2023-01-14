import pointInPolygon from 'point-in-polygon';
 
export default class GeometryUtils {

    
    /**
     * Checks if a point that is defined by a pair of coordinates (latitude and longitude) is inside a polygon defined by an array of coordinates
     * 
     * 
     * @param {JSON} point - The point to be checked. The point is defined by a pair of coordinates (latitude and longitude).
     * @param {Array<JSON>} polygon -  Array of JSON objects with coordinates (each JSON Object represents a point with latitude and longitude) that define the polygon.
     */
    static pointInPolygon (point, polygon) {

        // Create an array of coordinates from the polygon array
        const polygon_array = polygon.map((point) => {
            return [point.longitude, point.latitude];
        });

        return pointInPolygon([point.longitude, point.latitude], polygon_array);



        


    }





}
  
    