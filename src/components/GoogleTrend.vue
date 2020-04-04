<template>
  <div class="main">
    <div class="keywords">
      <div class="keywords-title">Keywords : </div>
      <vue-tags-input
              v-model="tag"
              :tags="tags"
              @tags-changed="newTags => tags = newTags"
      />
    </div>
    <div class="options">
      <div class="title2" style="font-size: 20px; font-weight: bolder"> OPTIONS </div>
      <div class="interval">
        <div class="title2">検索インターバル</div>
        <input type="number" v-model="search.interval.min" min="0" max="60" placeholder="0">
        <div>分</div>
        <input type="number" v-model="search.interval.sec" min="0" max="59" placeholder="5">
        <div>秒</div>
      </div>

      <div class="repeat-count">
        <div class="title2">反復回数</div>
        <input type="number" v-model="search.repeatCount" min="1" max="10" placeholder="5">
        <div>回</div>
      </div>
      <div>
        <hr style="width: 1000px;">
      </div>
      <div class="past">
        <input type="radio" name="dateType" v-model="search.usePast" v-bind:value=true>
        <div class="title">「 過去 」</div>
        <input type="number" v-model="search.before.year" min="0" max="4" placeholder="1" :disabled="!search.usePast">
        <div>年</div>
        <input type="number" v-model="search.before.month" min="0" max="12" placeholder="3" :disabled="!search.usePast">
        <div>月</div>
        <input type="number" v-model="search.before.day" min="0" max="31" placeholder="12" :disabled="!search.usePast">
        <div>日前から 今日まで</div>
      </div>
      <div class="select">
        <input type="radio" name="dateType" v-model="search.usePast" v-bind:value=false checked="checked">
        <div class="title">「 DATE 」</div>
        <input type="number" v-model="search.startDate.year" min="1000" max="9999" placeholder="2020" :disabled="search.usePast">
        <div>年</div>
        <input type="number" v-model="search.startDate.month" min="1" max="12" placeholder="1" :disabled="search.usePast">
        <div>月</div>
        <input type="number" v-model="search.startDate.day" min="1" max="31" placeholder="2" :disabled="search.usePast">
        <div>日</div>
        <div> から </div>
        <input type="number" v-model="search.endDate.year" min="1000" max="9999" placeholder="2020" :disabled="search.usePast">
        <div>年</div>
        <input type="number" v-model="search.endDate.month" min="1" max="12" placeholder="3" :disabled="search.usePast">
        <div>月</div>
        <input type="number" v-model="search.endDate.day" min="1" maxlength="31" placeholder="13" :disabled="search.usePast">
        <div>日まで</div>
      </div>
    </div>
    <button class="click" @click="find" :disabled="disabledButton"> Download Excel </button>
  </div>
</template>

<script>

import VueTagsInput from '@johmun/vue-tags-input';

export default {
  name: 'GoogleTrend',
  components: {
    VueTagsInput,
  },
  computed: {
    disabledButton: function() {
      if (this.tags.length < 1) return true
      console.log('1')
      if (this.getInterval < 1) return true
      console.log('2')
      if (this.search.repeatCount < 1) return true
      console.log('3')
      if (this.search.usePast && (this.search.before.year == "" &&
                                  this.search.before.month == "" &&
                                  this.search.before.day == "")) return true
      console.log('4')
      if (!this.search.usePast && (this.search.startDate.year == "" ||
                                   this.search.startDate.month == "" ||
                                   this.search.startDate.day == "" ||
                                   this.search.endDate.year == "" ||
                                   this.search.endDate.month == "" ||
                                   this.search.endDate.day == "")) return true
      console.log('5')
      return false
    },
    getInterval: function() {
      return this.search.interval.min * 60 + this.search.interval.sec
    }
  },
  data: function () {
    return {
      tag: '',
      tags: [],
      search: {
        interval: {
          min: 0,
          sec: 5
        },
        repeatCount: 5,
        usePast: false,
        startDate: {
          year: '',
          month: '',
          day: ''
        },
        endDate: {
          year: '',
          month: '',
          day: ''
        },
        before: {
          year: '',
          month: '',
          day: ''
        }
      }
    }
  },
  methods: {
    find: function() {
        const body = {
          keywords: this.tags.map(item => item.text),
          startdate: [
                      this.search.startDate.year,
                      this.search.startDate.month,
                      this.search.startDate.day,
                     ].join("."),
          enddate: [
                      !this.search.usePast ? "" : this.search.endDate.year,
                      !this.search.usePast ? "" : this.search.endDate.month,
                      !this.search.usePast ? "" : this.search.endDate.day,
                   ].join("."),
          beforeYear: this.search.before.year,
          beforeMonth: this.search.before.month,
          beforeDay: this.search.before.day,
          interval: this.getInterval,
          repeatCount: this.search.repeatCount
        }

        console.log('body :: ', body)

        this.$axios.post('https://boiling-crag-00492.herokuapp.com/google-trend',
        // this.$axios.post('https://localhost:3000/google-trend',
                body)
                .then(({data}) => {
                  console.log('data:: ', data)
                  if (data.type == "daily") {
                    this.downloadDaily(data.result, body)
                  } else {
                    this.downloadWeeky(data, body)
                  }

                }).catch(err => {
                  console.log('err', err)
        })
    },
    downloadDaily: function(excelData, {keywords, startdate, enddate, interval, repeatCount}) {
      const excel = excelData.map( item => {
        return {
          "期間": item.formattedTime,
          "スコア": item.formattedValue
        }
      })
      const ws = this.$xlsx.utils.json_to_sheet(excel)
      const wb = this.$xlsx.utils.book_new()
      this.$xlsx.utils.book_append_sheet(wb, ws, keywords)
      this.$xlsx.writeFile(wb,
              `GT(${keywords})_${startdate}~${enddate}_interval(${interval})_${repeatCount}repeat.xlsx`)
    },
    downloadWeeky: function(excelData, {keywords, startdate, enddate, interval, repeatCount}) {
      const excel = excelData.map( item => {
        return {
          "期間": item.formattedTime,
          "スコア": item.formattedValue
        }
      })
      const ws = this.$xlsx.utils.json_to_sheet(excel)
      const wb = this.$xlsx.utils.book_new()
      this.$xlsx.utils.book_append_sheet(wb, ws, keywords)
      this.$xlsx.writeFile(wb,
              `GT(${keywords})_${startdate}~${enddate}_interval(${interval})_${repeatCount}repeat.xlsx`)
    },
  },
  mounted: function () {
    const today = new Date()
    this.search.endDate.year = today.getFullYear()
    this.search.endDate.month = today.getMonth() + 1
    this.search.endDate.day = today.getDate()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.main {
}

.keywords {
  display: flex;
  align-items: center;
  /*justify-content: center;*/
  margin: auto;
}

.keywords-title {
  margin-left: 10px;
  margin-right: 10px;
}

.options {
  margin-top: 40px;
}

.options div {
  float: left;
  display: inline-block;
}

.title {
  width: 100px;
}

.title2 {
  width: 142px;
  text-align: left;
  margin-left: 18px;
}

.past, .select, .interval, .repeat-count {
  width: 100%;
}

.options input {
  float: left;
  margin-right: 5px;
  margin-left: 15px;
  width: 40px;
  text-align: center;
}

.click {
  margin-top: 15px;
  width: 200px;
  height: 30px;
}

input:disabled {
  background-color: lightgrey;
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
