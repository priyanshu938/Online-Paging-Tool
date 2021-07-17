const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/favicon.ico", express.static("favicon.ico"));
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
const reviewSchema = new mongoose.Schema({
  avatar: String,
  name: String,
  review: String,
  rating: String,
  time: String,
});
const User = mongoose.model("User", reviewSchema);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});
app.set("view engine", "ejs");
app.use(express.static("public"));

app.post("/", function (req, res) {
  var number_of_frames = parseInt(req.body.num1);
  var reference_string = req.body.num2.trim();
  var page_string = reference_string.split(" ");
  var length_of_string = page_string.length;
  if (req.body.hasOwnProperty("fifo")) {
    var i,
      j,
      k,
      avail,
      count = 0;
    let Array2D = (r, c) => [...Array(r)].map((x) => Array(c).fill(0));
    var frame = [],
      hit_string = [],
      string_frames = Array2D(number_of_frames, length_of_string);
    for (i = 0; i < number_of_frames; i++) {
      frame.push(-1);
    }
    j = 0;
    for (i = 0; i < length_of_string; i++) {
      avail = 0;
      for (k = 0; k < number_of_frames; k++) {
        if (frame[k] == page_string[i]) {
          avail = 1;
          hit_string.push("H");
        }
      }
      if (avail == 0) {
        frame[j] = page_string[i];
        j = (j + 1) % number_of_frames;
        count++;
        hit_string.push(" ");
      }
      for (var c = 0; c < number_of_frames; c++) {
        string_frames[c][i] = frame[c];
      }
    }
    res.render("list", {
      type: "Fifo",
      reference_string: reference_string,
      count: length_of_string - count,
      number_of_frames: number_of_frames,
      length_of_string: length_of_string,
      string_frames: string_frames,
      hit_string: hit_string,
    });
  }
  if (req.body.hasOwnProperty("lru")) {
    var frames = [],
      counter = 0,
      time = [],
      flag1,
      flag2,
      i,
      j,
      pos,
      faults = 0;
    let Array2D = (r, c) => [...Array(r)].map((x) => Array(c).fill(0));
    var disp = Array2D(number_of_frames, length_of_string);
    var disp_hit = [];

    for (i = 0; i < number_of_frames; ++i) {
      frames[i] = -1;
    }
    for (i = 0; i < length_of_string; i++) disp_hit.push("H");

    for (i = 0; i < length_of_string; ++i) {
      flag1 = 0;
      flag2 = 0;

      for (j = 0; j < number_of_frames; ++j) {
        if (frames[j] == page_string[i]) {
          counter++;
          time[j] = counter;
          flag1 = 1;
          flag2 = 1;
          break;
        }
      }

      if (flag1 == 0) {
        for (j = 0; j < number_of_frames; ++j) {
          if (frames[j] == -1) {
            counter++;
            faults++;
            disp_hit[i] = " ";
            frames[j] = page_string[i];
            time[j] = counter;
            flag2 = 1;
            break;
          }
        }
      }

      if (flag2 == 0) {
        var z,
          minimum = time[0],
          pos = 0;
        for (z = 1; z < number_of_frames; ++z) {
          if (time[z] < minimum) {
            minimum = time[z];
            pos = z;
          }
        }
        counter++;
        faults++;
        disp_hit[i] = " ";
        frames[pos] = page_string[i];
        time[pos] = counter;
      }

      for (j = 0; j < number_of_frames; j++) {
        disp[j][i] = frames[j];
      }
    }
    res.render("list", {
      type: "Lru",
      reference_string: reference_string,
      count: length_of_string - faults,
      number_of_frames: number_of_frames,
      length_of_string: length_of_string,
      string_frames: disp,
      hit_string: disp_hit,
    });
  }
  if (req.body.hasOwnProperty("lfu")) {
    var hit = 0;
    var frame = [],
      arr = [],
      time = [];
    let Array2D = (r, c) => [...Array(r)].map((x) => Array(c).fill(0));
    var disp = Array2D(number_of_frames, length_of_string);
    var disp_hit = [];
    var m, i, n, flag, k, minimum_time, temp;

    for (m = 0; m < length_of_string; m++) disp_hit.push(" ");
    for (m = 0; m < number_of_frames; m++) {
      frame.push(-1);
    }
    for (m = 0; m < length_of_string; m++) {
      arr.push(0);
      time.push(0);
    }

    for (m = 0; m < length_of_string; m++) {
      arr[page_string[m]]++;
      time[page_string[m]] = m;
      flag = 1;
      k = frame[0];
      for (n = 0; n < number_of_frames; n++) {
        if (frame[n] == -1 || frame[n] == page_string[m]) {
          if (frame[n] != -1) {
            hit++;
            disp_hit[m] = "H";
          }
          flag = 0;
          frame[n] = page_string[m];
          break;
        }
        if (arr[k] > arr[frame[n]]) {
          k = frame[n];
        }
      }
      if (flag) {
        minimum_time = length_of_string;
        for (n = 0; n < number_of_frames; n++) {
          if (arr[frame[n]] == arr[k] && time[frame[n]] < minimum_time) {
            temp = n;
            minimum_time = time[frame[n]];
          }
        }
        arr[frame[temp]] = 0;
        frame[temp] = page_string[m];
      }
      for (n = 0; n < number_of_frames; n++) {
        disp[n][m] = frame[n];
      }
    }

    res.render("list", {
      type: "Lfu",
      reference_string: reference_string,
      count: hit,
      number_of_frames: number_of_frames,
      length_of_string: length_of_string,
      string_frames: disp,
      hit_string: disp_hit,
    });
  }
  if (req.body.hasOwnProperty("optimal")) {
    var frames = [],
      interval = [];
    let Array2D = (r, c) => [...Array(r)].map((x) => Array(c).fill(0));
    var disp = Array2D(number_of_frames, length_of_string);
    var number_of_frames,
      page_faults = 0;
    var m, n, temp, flag, found;
    var position,
      maximum_interval,
      previous_frame = -1;
    var disp_hit = [];
    for (m = 0; m < number_of_frames; m++) {
      frames.push(-1);
    }
    for (m = 0; m < length_of_string; m++) disp_hit.push("H");
    for (m = 0; m < length_of_string; m++) {
      flag = 0;
      for (n = 0; n < number_of_frames; n++) {
        if (frames[n] == page_string[m]) {
          flag = 1;
          break;
        }
      }
      if (flag == 0) {
        if (previous_frame == number_of_frames - 1) {
          for (n = 0; n < number_of_frames; n++) {
            for (temp = m + 1; temp < length_of_string; temp++) {
              interval[n] = 0;
              if (frames[n] == page_string[temp]) {
                interval[n] = temp - m;
                break;
              }
            }
          }
          found = 0;
          for (n = 0; n < number_of_frames; n++) {
            if (interval[n] == 0) {
              position = n;
              found = 1;
              break;
            }
          }
        } else {
          position = ++previous_frame;
          found = 1;
        }
        if (found == 0) {
          maximum_interval = interval[0];
          position = 0;
          for (n = 1; n < number_of_frames; n++) {
            if (maximum_interval < interval[n]) {
              maximum_interval = interval[n];
              position = n;
            }
          }
        }
        frames[position] = page_string[m];

        page_faults++;
        disp_hit[m] = " ";
      }
      for (n = 0; n < number_of_frames; n++) {
        if (frames[n] != -1) {
          disp[n][m] = frames[n];
        } else disp[n][m] = -1;
      }
    }
    res.render("list", {
      type: "Optimal",
      reference_string: reference_string,
      count: length_of_string - page_faults,
      number_of_frames: number_of_frames,
      length_of_string: length_of_string,
      string_frames: disp,
      hit_string: disp_hit,
    });
  }
});
app.post("/list", function (req, res) {
  res.redirect("/");
});
app.get("/comment", function (req, res) {
  res.render("comment");
});
app.post("/comment", function (req, res) {
  if (req.body.hasOwnProperty("back")) {
    res.redirect("/");
  }
  if (req.body.hasOwnProperty("post")) {
    var name = req.body.name;
    var review = req.body.review;
    var rating = req.body.rating;
    var avatar = "https://joeschmoe.io/api/v1/" + name;

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    var t = new Date();
    var time = t.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    var time = time + " " + date + "/" + month + "/" + year;

    const user = new User({
      avatar: avatar,
      name: name,
      review: review,
      rating: rating,
      time: time,
    });
    user.save(function (err) {
      if (!err) {
        res.redirect("/reviews");
      }
    });
  }
});
app.get("/reviews", function (req, res) {
  User.find({}, function (err, comments) {
    res.render("reviews", {
      comments: comments,
    });
  });
});
app.post("/reviews", function (req, res) {
  if (req.body.hasOwnProperty("back")) res.redirect("/");
  if (req.body.hasOwnProperty("comment")) res.redirect("/comment");
});
app.listen(process.env.PORT || 3000, function () {
  console.log("Server is ported at 3000.");
});
