/*  
 *  Copyright (C) 2011, Alaric Holloway <alaric.holloway@gmail.com>
 *  
 *  This file is part of Alberti.
 *
 *  Alberti is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Alberti is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Alberti.  If not, see <http://www.gnu.org/licenses/>.
 *  
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * SpatialHash.js
 * 
 * A simple 2D spatial hash/index for fast nearest-neighbor searches with very 
 * little insertion/deletion overhead. The hash uses an auxiliary fast-lookup 
 * table to prevent the insertion of duplicate nodes, and to increase the 
 * speed of bulk deletions.
 * 
 * Note that SpatialHash is specialized for the lookup of Coord2D's alone, so 
 * there are no data nodes--buckets are merely arrays of Coord2D's.
 * 
 * REQUIRES
 * 
 * Util.js
 * geometry/Coord2D.js
 * 
 * USAGE
 * 
 * Create an instance of SpatialHash, passing in a bucket width to the
 * constructor. A good width is twice the maximum search radius of future 
 * searches (see below).
 * 
 * search(coord, radius)
 * 
 * Returns an array of Coord2D's within the given radius of 'coord', or empty
 * array if none found. For speed purposes, the radius pertains to a rectangle
 * rather than circle. The search radius must be no larger than half the 
 * SpatialHash instance's bucket width.
 * 
 * insert(coord)
 * 
 * Inserts a Coord2D. insert() does not clone the input coord, so you should 
 * insert a clone if you plan on modifying the original after insertion.
 * 
 * remove(coordArray)
 * 
 * Removes all of the Coord2D's in the given array.
 * 
 * * */
 
function SpatialHash(bucketWidth) {
	this.buckets = {};
	this.bucketWidth = bucketWidth;
	this.halfBucketWidth = bucketWidth / 2;
	
	this.bucketCount = 0;
	this.nodeCount = 0;
	
	// Each unique coordinate point is placed into this index, mapping a 2D 
	// coordinate string to an instance count, bucket index, and node index,
	// allowing for deletions without searching. A point is added to a bucket 
	// only if its fast lookup count is 0 at the time of insertion (i.e. the 
	// point is unique). Likewise, a point is only removed from the hash if 
	// its count reaches 0.
	this.fastLookup = {};
}

SpatialHash.prototype.search = function(queryCoord, radius) {
	Util.assert(radius <= this.halfBucketWidth, "Radius passed to SpatialHash::search must be no larger than half the bucket width.");
	
	var bx = Util.roundToMultiple(queryCoord.x, this.bucketWidth);
	var by = Util.roundToMultiple(queryCoord.y, this.bucketWidth);
	var buckets = [this.buckets[bx+","+by]];
	
	// Along with the indexed bucket, three neighboring buckets may need to be 
	// searched as well:
	//
	//    +---------+---------+
	//    |       K |       A |      Center of bucket 'A': (bx, by)
	//    |    o    |    o    |
	//    |         | x       |      Query coordinate 'x': (x, y)
	//    +---------+---------+
	//    |       J |       I |             Search radius: r
	//    |    o    |    o    |
	//    |         |         |              Bucket width: w
	//    +---------+---------+
	//
	// 'o' is each bucket's center (or index). If 'x' is the query coordinate,
	// neighbors I, J, and K may need to be searched also, as they may contain 
	// nodes closer to 'x' than the nodes contained in A (this is only true
	// if, |bx - x| + r >= w/2, or, |by - y| + r >= w/2).

	var dx = queryCoord.x - bx;
	var dy = queryCoord.y - by;
	
	// Determine relevant neighbor buckets
	var nx = Math.abs(dx) + radius >= this.halfBucketWidth ? bx + (Util.sign(dx) * this.bucketWidth) : null;
	var ny = Math.abs(dy) + radius >= this.halfBucketWidth ? by + (Util.sign(dy) * this.bucketWidth) : null;
	
	if (nx !== null) {
		buckets.push(this.buckets[nx+","+by]);
		
		if (ny !== null) {
			buckets.push(this.buckets[nx+","+ny]);
		}
	}
	
	if (ny !== null) {
		buckets.push(this.buckets[bx+","+ny]);
	}
	
	var nearNodes = [];
	
	// Iterate through candidate buckets searching for nodes near the query coordinate
	for (var i = 0, baLen = buckets.length; i < baLen; i++) {
		var bucket = buckets[i];
		
		if (bucket) {
			for (var j = 0, bLen = bucket.nodes.length; j < bLen; j++) {
				var node = bucket.nodes[j];
				
				if (Math.abs(node.x - queryCoord.x) <= radius && Math.abs(node.y - queryCoord.y) <= radius) {
					nearNodes.push(node.clone());
				}
			}
		}
	}
	
	return nearNodes;
}

SpatialHash.prototype.insert = function(coord) {
	var fastIndex = this.getLookupIndex(coord);
	var nodeInfo = this.fastLookup[fastIndex];
	
	if (!nodeInfo) {
		this.nodeCount++;
		
		var index = this.getBucketIndex(coord);
		var bucket = this.buckets[index];
		var nodeIndex;

		if (!bucket) {
			this.bucketCount++;
			this.buckets[index] = {"nodes":[coord], "dirty":false};
			nodeIndex = 0;
		} else {
			bucket.nodes.push(coord);
			nodeIndex = bucket.nodes.length - 1;
		}
		
		this.fastLookup[fastIndex] = {"count":1, "bucketIndex":index, "nodeIndex":nodeIndex};
	} else {
		nodeInfo.count++;
	}
};

SpatialHash.prototype.remove = function(coordArray) {
	for (var i = 0, caLen = coordArray.length; i < caLen; i++) {
		var coord = coordArray[i];
		var fastIndex = this.getLookupIndex(coord);
		var nodeInfo = this.fastLookup[fastIndex];
		
		if (nodeInfo) {
			if (--nodeInfo.count == 0) {
				this.nodeCount--;
				
				var bucket = this.buckets[nodeInfo.bucketIndex];
				
				// Set the removed node to null and mark its bucket as dirty
				bucket.nodes[nodeInfo.nodeIndex] = null;
				bucket.dirty = true;
				
				// Delete the fast lookup entry once its count drops to 0
				delete this.fastLookup[fastIndex];
			}
		}
	}
	
	for (var bucketIndex in this.buckets) {
		var bucket = this.buckets[bucketIndex];
		
		if (bucket.dirty) {
			var validNodes = [];
			var k = 0;
			
			for (var j = 0, bLen = bucket.nodes.length; j < bLen; j++) {
				var node = bucket.nodes[j];
				
				if (node) {
					validNodes.push(node);
					
					// This node's entry in the fast lookup table needs to be 
					// updated with the new node index.
					this.fastLookup[this.getLookupIndex(node)].nodeIndex = k++;
				}
			}
			
			// Clear null nodes from dirty buckets
			bucket.nodes = validNodes;
			bucket.dirty = false;

			// Delete the bucket if it no longer contains any nodes
			if (bucket.nodes.length == 0) {
				this.bucketCount--;
				delete this.buckets[bucketIndex];
			}
		}
	}
};

// Get the hash index for the given Coord2D. The index is simply a string
// composed of the components of the coord rounded to the nearest multiple of
// the bucket width. This elegantly and dynamically partitions the 2D space 
// into a grid of "buckets".
SpatialHash.prototype.getBucketIndex = function(coord) {
	return (Util.roundToMultiple(coord.x, this.bucketWidth)+","+Util.roundToMultiple(coord.y, this.bucketWidth));
};

// Get the fast lookup index for the given Coord2D
SpatialHash.prototype.getLookupIndex = function(coord) {
	return Util.roundToDecimal(coord.x, 3)+","+Util.roundToDecimal(coord.y, 3);
};
