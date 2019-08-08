$(document).ready(function () {
    new VoiceToText()
})
function RandomKey () {
    return 'randomkey' + (RandomKey.idx++)
}
RandomKey.idx = 0
class VoiceToText {
    constructor () {
        this.rec = null
        this.recblob = {}
        this.recId = ''
        this.isMic = true
        this.init()
    }
    // 初始化
    init () {
        document.body.onselectstart = document.body.oncontextmenu = function () { return false }
        this.recOpen()
        this.handleEvent()
        this.handleResize()
    }
    // 处理各种点击事件
    handleEvent () {
        let _this = this
        // 长按麦克风
        $('#mic-btn').longTap(function () {
            $('.mask').addClass('mask-show')
            _this.recStart()
        })
        // 松开手指
        $('#mic-btn').on('touchend', function () {
            $('.mask').removeClass('mask-show')
            $('.loading').addClass('mask-show')
            let p = new Promise((resolve, reject) => {
                resolve(_this)
            })
            p.then(_this.recStop).then(_this.uploadAudio).then(res => {
                let model = res.Result.split(',')
                $('.loading').removeClass('mask-show')
                if (res.Result === '') {
                    _this.tipShow('[呃，什么都没有听到]')
                }
                if (model.length === 1) {
                    $('#CorpName').val(res.Result)
                } else {
                    $('#CorpName').val(model[0])
                    $('#price').val(model[1])
                }
            }).catch(err => {
                $('.loading').removeClass('mask-show')
                _this.tipShow('[服务器开小差了...]')
            })
        })
        // 出价
        $('.submit').tap(function () {
            if (!_this.validate()) {
                return
            }
            _this.renderList()
            $('#CorpName').val('')
            $('#price').val('')
        })
        // 删除
        $('.list').on('tap', '.delete', function (item) {
            $(this).parent('.item').remove()
            $('.list').children().forEach((i, idx) => {
                $(i).find('span').first().text(parseFloat(idx) + 1)
            })
        })
    }
    // 处理窗口变化
    handleResize () {
        let _this = this
        window.onresize = function () {
            _this.isMic = !_this.isMic
            if (_this.isMic) {
                $('.mic').css('display', 'none')
            } else {
                $('.mic').css('display', 'block')
            }
        }
    }
    // 初始化录制
    recOpen () {
        this.rec = Recorder({
            type: 'wav', 
            bitRate: '16', 
            sampleRate: '16000', 
            onProcess: function (buffers, level, time, sampleRate) {
                // console.log(buffers, level, time, sampleRate)
                // $(".recpowerx").css("width", level + "%")
                // document.getElementsByClassName("recpowerx")[0].style.width = (level + "%")
                // $(".recpowert").html(time + "/" + level)
                // document.getElementsByClassName("recpowert")[0].innerHTML = (time + "/" + level)
                // document.getElementsByClassName("recpowert")[0].innerHTML = (time/1000).toFixed(1)
                // $(".recpowert").html((time / 1000).toFixed(1))
            }
        })
        this.rec.open()
    }
    // 开始录制
    recStart () {
        let rec = this.rec
        if (rec) {
            rec.start()
        }
    }
    // 结束录制
    recStop (_this) {
        let recblob = _this.recblob
        let rec = _this.rec
        return new Promise((resolve, reject) => {
            if (rec) {
                rec.stop(function (blob, time) {
                    let id = RandomKey()
                    recblob[id] = { blob: blob, set: $.extend({}, rec.set), time: time }
                    _this.recId = id
                    resolve(_this)
                }, function (s) {
                    reject('失败')
                })
            } else {
                reject('err')
            }
        })
    }
    // 上传音频并得到解析数据
    uploadAudio (_this) {
        return new Promise((resolve, reject) => {
            let recblob = _this.recblob
            let key = _this.recId
            let o = recblob[key]
            let form = new FormData()
            form.append('upfile', o.blob, 'recorder.wav') // 和普通form表单并无二致，后端接收到upfile参数的文件，文件名为recorder.wav
            // ...其他表单参数
            $.ajax({
                url: 'https://tzuat.coli688.com/ApiServer/api/eim/shares/upload/audio',  // 上传接口地址
                type: 'POST', 
                contentType: false,  // 让xhr自动处理Content-Type header，multipart/form-data需要生成随机的boundary
                processData: false,  // 不要处理data，让xhr自动处理
                data: form, 
                success: function (res) {
                    resolve(res.Data)
                }, 
                error: function (s) {
                    reject('fail')
                }
            })
        })
    }
    // 渲染
    renderList () {
        let idx = $('.list').children().length + 1
        let optionType = $('#optionType').val()
        let corpName = $('#CorpName').val()
        let price = $('#price').val()
        let html = `<div class='item border-b'>
            <span>${idx}</span>
            <span>${corpName}</span>
            <span>${optionType}</span>
            <span>${price}</span>
            <span class='delete'><i class='iconfont icon-delete'></i></span>
        </div>`
        $('.list').append(html)
    }
    // 验证
    validate () {
        let corpName = $('#CorpName').val()
        let price = $('#price').val()
        if (!corpName) {
            this.tipShow('请说话或者输入出价企业')
            return false
        }
        if (!price) {
            this.tipShow('请说话或者输入出价金额')
            return false
        }
        return true
    }
    // 错误提示
    tipShow (txt) {
        $('.tips').addClass('mask-show')
        $('.tips p').text(txt)
        setTimeout(() => {
            $('.tips').removeClass('mask-show')
        }, 2000)
    }
}
